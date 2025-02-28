use std::{mem, ptr};

use core_foundation::{base::TCFType, string::CFString};
use coreaudio::sys::{
  kAudioDevicePropertyDeviceUID, kAudioHardwareNoError, kAudioObjectPropertyElementMain,
  kAudioObjectPropertyScopeGlobal, kAudioObjectSystemObject, AudioDeviceID,
  AudioObjectGetPropertyData, AudioObjectID, AudioObjectPropertyAddress, CFStringRef,
};

use crate::error::CoreAudioError;

pub(crate) fn get_device_uid(
  device_id: AudioDeviceID,
) -> std::result::Result<CFString, CoreAudioError> {
  let system_output_id = get_device_audio_id(device_id)?;
  let address = AudioObjectPropertyAddress {
    mSelector: kAudioDevicePropertyDeviceUID,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain,
  };

  let mut output_uid: CFStringRef = ptr::null_mut();
  let mut data_size = mem::size_of::<CFStringRef>();
  let status = unsafe {
    AudioObjectGetPropertyData(
      system_output_id,
      &address,
      0,
      ptr::null_mut(),
      (&mut data_size as *mut usize).cast(),
      (&mut output_uid as *mut CFStringRef).cast(),
    )
  };

  if status != 0 {
    return Err(CoreAudioError::GetDeviceUidFailed(status));
  }
  Ok(unsafe { CFString::wrap_under_create_rule(output_uid.cast()) })
}

pub(crate) fn get_device_audio_id(
  device_id: AudioDeviceID,
) -> std::result::Result<AudioObjectID, CoreAudioError> {
  let mut system_output_id: AudioObjectID = 0;
  let mut data_size = mem::size_of::<AudioObjectID>();

  let address = AudioObjectPropertyAddress {
    mSelector: device_id,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain,
  };
  let status = unsafe {
    AudioObjectGetPropertyData(
      kAudioObjectSystemObject,
      &address,
      0,
      ptr::null_mut(),
      (&mut data_size as *mut usize).cast(),
      (&mut system_output_id as *mut AudioObjectID).cast(),
    )
  };
  if status != kAudioHardwareNoError as i32 {
    return Err(CoreAudioError::GetDefaultDeviceFailed(status));
  }
  Ok(system_output_id)
}
