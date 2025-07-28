# Tmux Utils Migration Guide: Exception-Based Error Handling

This guide helps you migrate from the old print-and-return error handling pattern to the new exception-based approach in `tmux_utils.py`.

## Overview of Changes

The `tmux_utils.py` file has been refactored to use proper Python exception handling instead of printing errors and returning special values. This provides more robust, predictable, and Pythonic error handling.

## New Exception Hierarchy

```python
TmuxError                    # Base exception for all tmux-related errors
├── TmuxSessionNotFound      # Session doesn't exist or no tmux server running
├── TmuxWindowNotFound       # Specific window doesn't exist
├── TmuxCommandError         # Tmux command execution failed
├── TmuxPermissionDenied     # User denied permission in safety mode
└── TmuxCaptureError         # Failed to capture window content
```

## Method Changes

### 1. `get_tmux_sessions()`

**Before:**
```python
sessions = orchestrator.get_tmux_sessions()
if not sessions:  # Could mean error OR no sessions
    print("No sessions or error occurred")
```

**After:**
```python
try:
    sessions = orchestrator.get_tmux_sessions()
    if not sessions:
        print("No tmux sessions found")
except TmuxSessionNotFound as e:
    print(f"No tmux server running: {e}")
except TmuxCommandError as e:
    print(f"Command failed: {e}")
```

### 2. `capture_window_content()`

**Before:**
```python
content = orchestrator.capture_window_content(session, window, 50)
if content.startswith("Error capturing"):
    print("Failed to capture content")
else:
    print(f"Content: {content}")
```

**After:**
```python
try:
    content = orchestrator.capture_window_content(session, window, 50)
    print(f"Content: {content}")
except TmuxCaptureError as e:
    print(f"Failed to capture content: {e}")
except TmuxWindowNotFound as e:
    print(f"Window not found: {e}")
```

### 3. `get_window_info()`

**Before:**
```python
info = orchestrator.get_window_info(session, window)
if 'error' in info:
    print(f"Error: {info['error']}")
else:
    print(f"Window name: {info['name']}")
```

**After:**
```python
try:
    info = orchestrator.get_window_info(session, window)
    print(f"Window name: {info['name']}")
except TmuxWindowNotFound as e:
    print(f"Window not found: {e}")
except TmuxCommandError as e:
    print(f"Command failed: {e}")
except TmuxCaptureError as e:
    print(f"Content capture failed: {e}")
```

### 4. `send_keys_to_window()` and `send_command_to_window()`

**Before:**
```python
success = orchestrator.send_keys_to_window(session, window, "ls")
if not success:
    print("Failed to send keys")
```

**After:**
```python
try:
    orchestrator.send_keys_to_window(session, window, "ls")
    print("Keys sent successfully")
except TmuxPermissionDenied as e:
    print(f"Permission denied: {e}")
except TmuxWindowNotFound as e:
    print(f"Window not found: {e}")
except TmuxCommandError as e:
    print(f"Command failed: {e}")
```

## Monitoring Functions (Backward Compatible)

The monitoring functions `get_all_windows_status()` and `create_monitoring_snapshot()` handle exceptions gracefully and maintain backward compatibility:

```python
# These continue to work as before, but now include error information
status = orchestrator.get_all_windows_status()
snapshot = orchestrator.create_monitoring_snapshot()

# Check for errors in the results
if 'error' in status:
    print(f"Status error: {status['error']}")

for session in status.get('sessions', []):
    for window in session['windows']:
        if 'error' in window['info']:
            print(f"Window error: {window['info']['error']}")
```

## Best Practices

### 1. Catch Specific Exceptions

```python
try:
    sessions = orchestrator.get_tmux_sessions()
except TmuxSessionNotFound:
    # Handle no tmux server case
    start_tmux_server()
except TmuxCommandError as e:
    # Handle command execution errors
    log_error(f"Tmux command failed: {e}")
```

### 2. Use Base Exception for General Handling

```python
try:
    info = orchestrator.get_window_info(session, window)
except TmuxError as e:
    # Catch any tmux-related error
    print(f"Tmux operation failed: {e}")
```

### 3. Graceful Degradation in Monitoring

```python
def safe_monitor_windows():
    try:
        sessions = orchestrator.get_tmux_sessions()
    except TmuxError:
        # Fall back to alternative monitoring
        return monitor_via_ps()
    
    for session in sessions:
        for window in session.windows:
            try:
                info = orchestrator.get_window_info(session.name, window.window_index)
                process_window_info(info)
            except TmuxError as e:
                # Log error but continue with other windows
                log_warning(f"Skipping window {window.window_index}: {e}")
```

## Benefits of the New Approach

1. **Explicit Error Handling**: Errors are now explicit and must be handled
2. **Specific Error Types**: Different exceptions for different error conditions
3. **Better Debugging**: Exception stack traces provide better debugging information
4. **Pythonic**: Follows Python best practices for error handling
5. **Testable**: Exceptions can be easily tested with `pytest.raises()`
6. **Informative**: Error messages include context and actionable information

## Testing Your Migration

Use the provided `test_tmux_exceptions.py` script to verify your migration:

```bash
python3 test_tmux_exceptions.py
```

This script demonstrates proper exception handling for all the refactored methods.

## Gradual Migration Strategy

1. **Phase 1**: Update critical error handling paths to use try-catch
2. **Phase 2**: Update all calling code to use exception handling
3. **Phase 3**: Remove any remaining error-checking based on return values
4. **Phase 4**: Add comprehensive error handling tests

The monitoring functions (`get_all_windows_status()` and `create_monitoring_snapshot()`) continue to work with the old pattern during the transition period, making migration easier.
