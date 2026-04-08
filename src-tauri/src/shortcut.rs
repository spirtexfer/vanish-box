use tauri::App;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const DEFAULT_KEYBIND: &str = "ctrl+shift+j";

pub fn setup_shortcut(app: &mut App) -> tauri::Result<()> {
    use tauri::Manager;

    // Read persisted keybind from disk; fall back to default on first launch
    let data_dir = app.handle().path().app_data_dir()?;
    let keybind_path = data_dir.join("keybind.txt");
    let keybind = std::fs::read_to_string(&keybind_path)
        .unwrap_or_else(|_| DEFAULT_KEYBIND.to_string());
    let keybind = keybind.trim().to_string();

    let shortcut = crate::commands::parse_keybind(&keybind)
        .unwrap_or_else(|_| {
            crate::commands::parse_keybind(DEFAULT_KEYBIND)
                .expect("default keybind must always parse")
        });

    app.handle()
        .global_shortcut()
        .on_shortcut(shortcut, |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                crate::window::toggle_panel(app_handle);
            }
        })
        .map_err(|e| tauri::Error::Anyhow(e.into()))?;

    Ok(())
}
