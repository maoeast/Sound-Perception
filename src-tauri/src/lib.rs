#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default().plugin(tauri_plugin_fs::init());

  if cfg!(debug_assertions) {
    builder = builder.plugin(
      tauri_plugin_log::Builder::default()
        .clear_targets()
        .target(tauri_plugin_log::Target::new(
          tauri_plugin_log::TargetKind::Stdout,
        ))
        .level(log::LevelFilter::Info)
        .build(),
    );
  }

  builder
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
