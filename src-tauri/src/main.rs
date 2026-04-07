// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod shortcut;
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::copy_file,
            commands::open_file,
            commands::open_url,
            commands::trash_file,
            commands::update_shortcut,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;
            shortcut::setup_shortcut(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
