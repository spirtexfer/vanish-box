use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

pub fn setup_tray(app: &mut App) -> tauri::Result<()> {
    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Vanish Box")
        .build(app)?;

    tray.on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click { .. } = event {
            crate::window::toggle_panel(tray.app_handle());
        }
    });

    Ok(())
}
