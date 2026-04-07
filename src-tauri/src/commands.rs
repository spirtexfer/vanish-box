use serde::Serialize;

#[derive(Serialize)]
pub struct CopiedFileInfo {
    pub id: String,
    pub original_name: String,
    pub stored_path: String,
    pub source_path: String,
    pub size: u64,
}

fn os_open(target: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", target])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Copy a file from `source` into the app's managed files directory.
/// Returns metadata about the copied file including its new path.
#[tauri::command]
pub fn copy_file(
    app_handle: tauri::AppHandle,
    source: String,
) -> Result<CopiedFileInfo, String> {
    use tauri::Manager;

    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let files_dir = data_dir.join("files");
    std::fs::create_dir_all(&files_dir).map_err(|e| e.to_string())?;

    let source_path = std::path::Path::new(&source);
    let original_name = source_path
        .file_name()
        .ok_or_else(|| "No filename in path".to_string())?
        .to_string_lossy()
        .to_string();

    // Unique stored name: timestamp_ms + original name
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let stored_name = format!("{}_{}", ts, original_name);
    let dest = files_dir.join(&stored_name);

    let size = std::fs::copy(source_path, &dest).map_err(|e| e.to_string())?;

    let stored_path = dest.to_string_lossy().to_string();
    Ok(CopiedFileInfo {
        id: stored_name,
        original_name,
        stored_path,
        source_path: source,
        size,
    })
}

/// Open a file with the default OS application.
#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    os_open(&path)
}

/// Open a URL in the system's default browser.
#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    os_open(&url)
}

/// Permanently delete a file from the app's managed storage.
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

/// Move the original source file to the system trash and delete the app's stored copy.
/// If source_path is empty (files imported before sourcePath tracking was added), only
/// the stored copy is deleted.
#[tauri::command]
pub fn trash_file(source_path: String, stored_path: String) -> Result<(), String> {
    if !source_path.is_empty() {
        trash::delete(&source_path).map_err(|e| e.to_string())?;
    }
    if let Err(e) = std::fs::remove_file(&stored_path) {
        eprintln!("[VanishBox] Failed to delete stored copy at {stored_path}: {e}");
    }
    Ok(())
}

pub fn str_to_code(s: &str) -> Result<tauri_plugin_global_shortcut::Code, String> {
    use tauri_plugin_global_shortcut::Code;
    match s {
        "a" => Ok(Code::KeyA), "b" => Ok(Code::KeyB), "c" => Ok(Code::KeyC),
        "d" => Ok(Code::KeyD), "e" => Ok(Code::KeyE), "f" => Ok(Code::KeyF),
        "g" => Ok(Code::KeyG), "h" => Ok(Code::KeyH), "i" => Ok(Code::KeyI),
        "j" => Ok(Code::KeyJ), "k" => Ok(Code::KeyK), "l" => Ok(Code::KeyL),
        "m" => Ok(Code::KeyM), "n" => Ok(Code::KeyN), "o" => Ok(Code::KeyO),
        "p" => Ok(Code::KeyP), "q" => Ok(Code::KeyQ), "r" => Ok(Code::KeyR),
        "s" => Ok(Code::KeyS), "t" => Ok(Code::KeyT), "u" => Ok(Code::KeyU),
        "v" => Ok(Code::KeyV), "w" => Ok(Code::KeyW), "x" => Ok(Code::KeyX),
        "y" => Ok(Code::KeyY), "z" => Ok(Code::KeyZ),
        "0" => Ok(Code::Digit0), "1" => Ok(Code::Digit1), "2" => Ok(Code::Digit2),
        "3" => Ok(Code::Digit3), "4" => Ok(Code::Digit4), "5" => Ok(Code::Digit5),
        "6" => Ok(Code::Digit6), "7" => Ok(Code::Digit7), "8" => Ok(Code::Digit8),
        "9" => Ok(Code::Digit9),
        "f1" => Ok(Code::F1), "f2" => Ok(Code::F2), "f3" => Ok(Code::F3),
        "f4" => Ok(Code::F4), "f5" => Ok(Code::F5), "f6" => Ok(Code::F6),
        "f7" => Ok(Code::F7), "f8" => Ok(Code::F8), "f9" => Ok(Code::F9),
        "f10" => Ok(Code::F10), "f11" => Ok(Code::F11), "f12" => Ok(Code::F12),
        "space" => Ok(Code::Space),
        other => Err(format!("Unsupported key: {other}")),
    }
}

pub fn parse_keybind(keybind: &str) -> Result<tauri_plugin_global_shortcut::Shortcut, String> {
    use tauri_plugin_global_shortcut::{Modifiers, Shortcut};
    let lowered = keybind.to_lowercase();
    let parts: Vec<&str> = lowered.split('+').collect();
    let mut modifiers = Modifiers::empty();
    let mut key_code = None;
    for part in &parts {
        match *part {
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" => modifiers |= Modifiers::ALT,
            "super" | "meta" | "cmd" | "win" => modifiers |= Modifiers::SUPER,
            _ => { key_code = Some(str_to_code(part)?); }
        }
    }
    let code = key_code.ok_or_else(|| "No key specified in keybind".to_string())?;
    Ok(Shortcut::new(if modifiers.is_empty() { None } else { Some(modifiers) }, code))
}

/// Unregister all shortcuts, register a new one, and persist the keybind to disk
/// so setup_shortcut can read it on next launch.
#[tauri::command]
pub fn update_shortcut(app_handle: tauri::AppHandle, keybind: String) -> Result<(), String> {
    use tauri::Manager;
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    // Parse FIRST — if the keybind is invalid, bail before touching the registered shortcut.
    let shortcut = parse_keybind(&keybind)?;

    let data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    std::fs::write(data_dir.join("keybind.txt"), &keybind).map_err(|e| e.to_string())?;

    app_handle.global_shortcut().unregister_all().map_err(|e| e.to_string())?;
    app_handle
        .global_shortcut()
        .on_shortcut(shortcut, |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                crate::window::toggle_panel(app_handle);
            }
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}
