pub(crate) fn create_audio_tap_queue() -> *mut dispatch2::ffi::dispatch_queue_s {
  let queue_attr = unsafe {
    dispatch2::ffi::dispatch_queue_attr_make_with_qos_class(
      dispatch2::ffi::DISPATCH_QUEUE_SERIAL,
      dispatch2::ffi::dispatch_qos_class_t::QOS_CLASS_USER_INITIATED,
      0,
    )
  };
  unsafe {
    dispatch2::ffi::dispatch_queue_create(c"ProcessTapRecorder".as_ptr().cast(), queue_attr)
  }
}
