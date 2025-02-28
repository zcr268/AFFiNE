use std::{ffi::c_void, sync::Arc};

use block2::{Block, RcBlock};
use core_foundation::{
  array::CFArray,
  base::{CFType, ItemRef, TCFType},
  boolean::CFBoolean,
  dictionary::CFDictionary,
  string::CFString,
  uuid::CFUUID,
};
use coreaudio::sys::{
  kAudioAggregateDeviceIsPrivateKey, kAudioAggregateDeviceIsStackedKey,
  kAudioAggregateDeviceMainSubDeviceKey, kAudioAggregateDeviceNameKey,
  kAudioAggregateDeviceSubDeviceListKey, kAudioAggregateDeviceTapAutoStartKey,
  kAudioAggregateDeviceTapListKey, kAudioAggregateDeviceUIDKey, kAudioHardwareNoError,
  kAudioHardwarePropertyDefaultInputDevice, kAudioHardwarePropertyDefaultSystemOutputDevice,
  kAudioSubDeviceUIDKey, kAudioSubTapDriftCompensationKey, kAudioSubTapUIDKey,
  AudioDeviceCreateIOProcIDWithBlock, AudioDeviceDestroyIOProcID, AudioDeviceIOProcID,
  AudioDeviceStart, AudioDeviceStop, AudioHardwareCreateAggregateDevice,
  AudioHardwareDestroyAggregateDevice, AudioObjectID, AudioTimeStamp, OSStatus,
};
use napi::{
  bindgen_prelude::Float32Array,
  threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
  Result,
};
use napi_derive::napi;
use objc2::{runtime::AnyObject, Encode, Encoding, RefEncode};

use crate::{
  audio_stream_basic_desc::read_audio_stream_basic_description,
  ca_tap_description::CATapDescription, device::get_device_uid, error::CoreAudioError,
  queue::create_audio_tap_queue, screen_capture_kit::TappableApplication,
};

extern "C" {
  fn AudioHardwareCreateProcessTap(
    inDescription: *mut AnyObject,
    outTapID: *mut AudioObjectID,
  ) -> OSStatus;

  fn AudioHardwareDestroyProcessTap(tapID: AudioObjectID) -> OSStatus;
}

/// [Apple's documentation](https://developer.apple.com/documentation/coreaudiotypes/audiobuffer?language=objc)
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
#[allow(non_snake_case)]
pub struct AudioBuffer {
  pub mNumberChannels: u32,
  pub mDataByteSize: u32,
  pub mData: *mut c_void,
}

unsafe impl Encode for AudioBuffer {
  const ENCODING: Encoding = Encoding::Struct(
    "AudioBuffer",
    &[<u32>::ENCODING, <u32>::ENCODING, <*mut c_void>::ENCODING],
  );
}

unsafe impl RefEncode for AudioBuffer {
  const ENCODING_REF: Encoding = Encoding::Pointer(&Self::ENCODING);
}

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
#[allow(non_snake_case)]
pub struct AudioBufferList {
  pub mNumberBuffers: u32,
  pub mBuffers: [AudioBuffer; 1],
}

unsafe impl Encode for AudioBufferList {
  const ENCODING: Encoding = Encoding::Struct(
    "AudioBufferList",
    &[<u32>::ENCODING, <[AudioBuffer; 1]>::ENCODING],
  );
}

unsafe impl RefEncode for AudioBufferList {
  const ENCODING_REF: Encoding = Encoding::Pointer(&Self::ENCODING);
}

// Audio statistics structure to track audio format information
#[derive(Clone, Copy, Debug)]
pub struct AudioStats {
  pub sample_rate: f64,
  pub channels: u32,
}

pub struct AggregateDevice {
  pub tap_id: AudioObjectID,
  pub id: AudioObjectID,
  pub audio_stats: Option<AudioStats>,
}

impl AggregateDevice {
  pub fn new(app: &TappableApplication) -> Result<Self> {
    let object_id = app.object_id;

    let tap_description = CATapDescription::init_stereo_mixdown_of_processes(object_id)?;
    let mut tap_id: AudioObjectID = 0;

    let status = unsafe { AudioHardwareCreateProcessTap(tap_description.inner, &mut tap_id) };

    if status != 0 {
      return Err(CoreAudioError::CreateProcessTapFailed(status).into());
    }

    let description_dict = Self::create_aggregate_description(tap_id, tap_description.get_uuid()?)?;

    let mut aggregate_device_id: AudioObjectID = 0;

    let status = unsafe {
      AudioHardwareCreateAggregateDevice(
        description_dict.as_concrete_TypeRef().cast(),
        &mut aggregate_device_id,
      )
    };

    if status != 0 {
      return Err(CoreAudioError::CreateAggregateDeviceFailed(status).into());
    }

    Ok(Self {
      tap_id,
      id: aggregate_device_id,
      audio_stats: None,
    })
  }

  pub fn new_from_object_id(object_id: AudioObjectID) -> Result<Self> {
    let mut tap_id: AudioObjectID = 0;

    let tap_description = CATapDescription::init_stereo_mixdown_of_processes(object_id)?;
    let status = unsafe { AudioHardwareCreateProcessTap(tap_description.inner, &mut tap_id) };

    if status != 0 {
      return Err(CoreAudioError::CreateProcessTapFailed(status).into());
    }

    let description_dict = Self::create_aggregate_description(tap_id, tap_description.get_uuid()?)?;

    let mut aggregate_device_id: AudioObjectID = 0;

    let status = unsafe {
      AudioHardwareCreateAggregateDevice(
        description_dict.as_concrete_TypeRef().cast(),
        &mut aggregate_device_id,
      )
    };

    if status != 0 {
      return Err(CoreAudioError::CreateAggregateDeviceFailed(status).into());
    }

    Ok(Self {
      tap_id,
      id: aggregate_device_id,
      audio_stats: None,
    })
  }

  pub fn create_global_tap_but_exclude_processes(processes: &[AudioObjectID]) -> Result<Self> {
    let mut tap_id: AudioObjectID = 0;
    let tap_description =
      CATapDescription::init_stereo_global_tap_but_exclude_processes(processes)?;
    let status = unsafe { AudioHardwareCreateProcessTap(tap_description.inner, &mut tap_id) };

    if status != 0 {
      return Err(CoreAudioError::CreateProcessTapFailed(status).into());
    }

    let description_dict = Self::create_aggregate_description(tap_id, tap_description.get_uuid()?)?;

    let mut aggregate_device_id: AudioObjectID = 0;

    let status = unsafe {
      AudioHardwareCreateAggregateDevice(
        description_dict.as_concrete_TypeRef().cast(),
        &mut aggregate_device_id,
      )
    };

    // Check the status and return the appropriate result
    if status != 0 {
      return Err(CoreAudioError::CreateAggregateDeviceFailed(status).into());
    }

    Ok(Self {
      tap_id,
      id: aggregate_device_id,
      audio_stats: None,
    })
  }

  pub fn start(
    &mut self,
    audio_stream_callback: Arc<ThreadsafeFunction<Float32Array, (), Float32Array, true>>,
  ) -> Result<AudioTapStream> {
    // Read and log the audio format before starting the device
    let mut audio_stats = AudioStats {
      sample_rate: 44100.0,
      channels: 1, // Always set to 1 channel (mono)
    };

    if let Ok(audio_format) = read_audio_stream_basic_description(self.tap_id) {
      // Store the audio format information
      audio_stats.sample_rate = audio_format.0.mSampleRate;
      // Always use 1 channel regardless of what the system reports
      audio_stats.channels = 1;
    }

    self.audio_stats = Some(audio_stats);
    let audio_stats_clone = audio_stats;

    let queue = create_audio_tap_queue();
    let mut in_proc_id: AudioDeviceIOProcID = None;

    let in_io_block: RcBlock<
      dyn Fn(*mut c_void, *mut c_void, *mut c_void, *mut c_void, *mut c_void) -> i32,
    > = RcBlock::new(
      move |_in_now: *mut c_void,
            in_input_data: *mut c_void,
            in_input_time: *mut c_void,
            _out_output_data: *mut c_void,
            _in_output_time: *mut c_void| {
        let AudioTimeStamp { mSampleTime, .. } = unsafe { &*in_input_time.cast() };

        // ignore pre-roll
        if *mSampleTime < 0.0 {
          return kAudioHardwareNoError as i32;
        }
        let AudioBufferList { mBuffers, .. } =
          unsafe { &mut *in_input_data.cast::<AudioBufferList>() };
        let [AudioBuffer {
          mData,
          mNumberChannels,
          mDataByteSize,
        }] = mBuffers;
        // Only create slice if we have valid data
        if !mData.is_null() && *mDataByteSize > 0 {
          // Calculate total number of samples (accounting for interleaved stereo)
          let total_samples = *mDataByteSize as usize / 4; // 4 bytes per f32

          // Create a slice of all samples
          let samples: &[f32] =
            unsafe { std::slice::from_raw_parts(mData.cast::<f32>(), total_samples) };

          // Check the channel count and data format
          let channel_count = *mNumberChannels as usize;

          // Process the audio based on channel count
          let mut processed_samples: Vec<f32>;

          if channel_count > 1 {
            // For stereo, samples are interleaved: [L, R, L, R, ...]
            // We need to average each pair to get mono
            let frame_count = total_samples / channel_count;
            processed_samples = Vec::with_capacity(frame_count);

            for i in 0..frame_count {
              let mut frame_sum = 0.0;
              for c in 0..channel_count {
                frame_sum += samples[i * channel_count + c];
              }
              processed_samples.push(frame_sum / (channel_count as f32));
            }
          } else {
            // Already mono, just copy the samples
            processed_samples = samples.to_vec();
          }

          // Pass the processed samples to the callback
          audio_stream_callback.call(
            Ok(processed_samples.into()),
            ThreadsafeFunctionCallMode::NonBlocking,
          );
        }

        kAudioHardwareNoError as i32
      },
    );

    let status = unsafe {
      AudioDeviceCreateIOProcIDWithBlock(
        &mut in_proc_id,
        self.id,
        queue.cast(),
        (&*in_io_block
          as *const Block<
            dyn Fn(*mut c_void, *mut c_void, *mut c_void, *mut c_void, *mut c_void) -> i32,
          >)
          .cast_mut()
          .cast(),
      )
    };
    if status != 0 {
      return Err(CoreAudioError::CreateIOProcIDWithBlockFailed(status).into());
    }
    let status = unsafe { AudioDeviceStart(self.id, in_proc_id) };
    if status != 0 {
      return Err(CoreAudioError::AudioDeviceStartFailed(status).into());
    }

    Ok(AudioTapStream {
      device_id: self.id,
      in_proc_id,
      stop_called: false,
      audio_stats: audio_stats_clone,
    })
  }

  fn create_aggregate_description(
    tap_id: AudioObjectID,
    tap_uuid_string: ItemRef<CFString>,
  ) -> Result<CFDictionary<CFType, CFType>> {
    let system_output_uid = get_device_uid(kAudioHardwarePropertyDefaultSystemOutputDevice)?;
    let default_input_uid = get_device_uid(kAudioHardwarePropertyDefaultInputDevice)?;

    let aggregate_device_name = CFString::new(&format!("Tap-{}", tap_id));
    let aggregate_device_uid: uuid::Uuid = CFUUID::new().into();
    let aggregate_device_uid_string = aggregate_device_uid.to_string();

    // Sub-device UID key and dictionary
    let sub_device_output_dict = CFDictionary::from_CFType_pairs(&[(
      cfstring_from_bytes_with_nul(kAudioSubDeviceUIDKey).as_CFType(),
      system_output_uid.as_CFType(),
    )]);

    let sub_device_input_dict = CFDictionary::from_CFType_pairs(&[(
      cfstring_from_bytes_with_nul(kAudioSubDeviceUIDKey).as_CFType(),
      default_input_uid.as_CFType(),
    )]);

    let tap_device_dict = CFDictionary::from_CFType_pairs(&[
      (
        cfstring_from_bytes_with_nul(kAudioSubTapDriftCompensationKey).as_CFType(),
        CFBoolean::false_value().as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioSubTapUIDKey).as_CFType(),
        tap_uuid_string.as_CFType(),
      ),
    ]);

    let capture_device_list = vec![sub_device_input_dict, sub_device_output_dict];

    // Sub-device list
    let sub_device_list = CFArray::from_CFTypes(&capture_device_list);

    let tap_list = CFArray::from_CFTypes(&[tap_device_dict]);

    // Create the aggregate device description dictionary
    let description_dict = CFDictionary::from_CFType_pairs(&[
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceNameKey).as_CFType(),
        aggregate_device_name.as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceUIDKey).as_CFType(),
        CFString::new(aggregate_device_uid_string.as_str()).as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceMainSubDeviceKey).as_CFType(),
        system_output_uid.as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceIsPrivateKey).as_CFType(),
        CFBoolean::true_value().as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceIsStackedKey).as_CFType(),
        CFBoolean::false_value().as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceTapAutoStartKey).as_CFType(),
        CFBoolean::true_value().as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceSubDeviceListKey).as_CFType(),
        sub_device_list.as_CFType(),
      ),
      (
        cfstring_from_bytes_with_nul(kAudioAggregateDeviceTapListKey).as_CFType(),
        tap_list.as_CFType(),
      ),
    ]);
    Ok(description_dict)
  }
}

#[napi]
pub struct AudioTapStream {
  device_id: AudioObjectID,
  in_proc_id: AudioDeviceIOProcID,
  stop_called: bool,
  audio_stats: AudioStats,
}

#[napi]
impl AudioTapStream {
  #[napi]
  pub fn stop(&mut self) -> Result<()> {
    if self.stop_called {
      return Ok(());
    }
    self.stop_called = true;
    let status = unsafe { AudioDeviceStop(self.device_id, self.in_proc_id) };
    if status != 0 {
      return Err(CoreAudioError::AudioDeviceStopFailed(status).into());
    }
    let status = unsafe { AudioDeviceDestroyIOProcID(self.device_id, self.in_proc_id) };
    if status != 0 {
      return Err(CoreAudioError::AudioDeviceDestroyIOProcIDFailed(status).into());
    }
    let status = unsafe { AudioHardwareDestroyAggregateDevice(self.device_id) };
    if status != 0 {
      return Err(CoreAudioError::AudioHardwareDestroyAggregateDeviceFailed(status).into());
    }
    let status = unsafe { AudioHardwareDestroyProcessTap(self.device_id) };
    if status != 0 {
      return Err(CoreAudioError::AudioHardwareDestroyProcessTapFailed(status).into());
    }
    Ok(())
  }

  #[napi(getter)]
  pub fn get_sample_rate(&self) -> f64 {
    self.audio_stats.sample_rate
  }

  #[napi(getter)]
  pub fn get_channels(&self) -> u32 {
    self.audio_stats.channels
  }
}

fn cfstring_from_bytes_with_nul(bytes: &'static [u8]) -> CFString {
  CFString::new(
    unsafe { std::ffi::CStr::from_bytes_with_nul_unchecked(bytes) }
      .to_string_lossy()
      .as_ref(),
  )
}
