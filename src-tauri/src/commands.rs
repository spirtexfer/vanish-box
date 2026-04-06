use serde::Serialize;

#[derive(Serialize)]
pub struct CopiedFileInfo {
    pub id: String,
    pub original_name: String,
    pub stored_path: String,
    pub source_path: String,
    pub size: u64,
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

    std::fs::copy(source_path, &dest).map_err(|e| e.to_string())?;
    let size = std::fs::metadata(&dest).map(|m| m.len()).unwrap_or(0);

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
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Open a URL in the system's default browser.
#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Permanently delete a file from the app's managed storage.
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

/// Move the original source file to the system trash and delete the app's stored copy.
#[tauri::command]
pub fn trash_file(source_path: String, stored_path: String) -> Result<(), String> {
    trash::delete(&source_path).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&stored_path);
    Ok(())
}
