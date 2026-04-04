use serde::Serialize;

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub path: String,
}

#[tauri::command]
pub fn get_file_infos(paths: Vec<String>) -> Vec<FileInfo> {
    paths
        .iter()
        .filter_map(|path| {
            let p = std::path::Path::new(path);
            let name = p.file_name()?.to_string_lossy().to_string();
            let size = std::fs::metadata(p).map(|m| m.len()).unwrap_or(0);
            Some(FileInfo {
                name,
                size,
                path: path.clone(),
            })
        })
        .collect()
}

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
