use std::path::PathBuf;
use std::process::Command;

pub fn sidecar_path() -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe.parent().ok_or_else(|| "no executable directory".to_string())?;
    Ok(dir.join("yoink"))
}

pub fn run(args: &[String]) -> Result<String, String> {
    let path = sidecar_path()?;
    let output = Command::new(path)
        .args(args)
        .env("NO_COLOR", "1")
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

pub fn run_with_stdin(args: &[String], stdin_data: &str) -> Result<String, String> {
    use std::io::Write;
    use std::process::Stdio;

    let path = sidecar_path()?;
    let mut child = Command::new(path)
        .args(args)
        .env("NO_COLOR", "1")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
    child
        .stdin
        .take()
        .ok_or_else(|| "no stdin handle".to_string())?
        .write_all(stdin_data.as_bytes())
        .map_err(|e| e.to_string())?;
    let output = child.wait_with_output().map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

pub fn is_claude_running() -> bool {
    Command::new("pgrep")
        .args(["-x", "claude"])
        .output()
        .map(|o| o.status.success() && !o.stdout.is_empty())
        .unwrap_or(false)
}
