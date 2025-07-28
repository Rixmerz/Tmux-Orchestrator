#!/usr/bin/env python3
"""
Test script to demonstrate the new exception-based error handling in tmux_utils.py

This script shows how to properly handle the new TmuxError exceptions.
"""

import sys
from tmux_utils import (
    TmuxOrchestrator, 
    TmuxError, 
    TmuxSessionNotFound, 
    TmuxWindowNotFound, 
    TmuxCommandError, 
    TmuxPermissionDenied, 
    TmuxCaptureError
)


def test_get_sessions():
    """Test getting tmux sessions with proper exception handling."""
    print("Testing get_tmux_sessions()...")
    orchestrator = TmuxOrchestrator()
    
    try:
        sessions = orchestrator.get_tmux_sessions()
        print(f"✅ Found {len(sessions)} tmux sessions")
        for session in sessions:
            print(f"  - {session.name} ({'attached' if session.attached else 'detached'}) - {len(session.windows)} windows")
    except TmuxSessionNotFound as e:
        print(f"❌ No tmux server running: {e}")
    except TmuxCommandError as e:
        print(f"❌ Tmux command failed: {e}")
        print(f"   Command: {' '.join(e.command)}")
        print(f"   Error: {e.stderr}")
    except TmuxError as e:
        print(f"❌ General tmux error: {e}")


def test_window_operations():
    """Test window operations with proper exception handling."""
    print("\nTesting window operations...")
    orchestrator = TmuxOrchestrator()
    
    try:
        sessions = orchestrator.get_tmux_sessions()
        if not sessions:
            print("No sessions available for testing")
            return
            
        # Test with first available session and window
        session = sessions[0]
        if not session.windows:
            print("No windows available for testing")
            return
            
        window = session.windows[0]
        print(f"Testing with session '{session.name}', window {window.window_index}")
        
        # Test get_window_info
        try:
            info = orchestrator.get_window_info(session.name, window.window_index)
            print(f"✅ Window info retrieved: {info['name']} ({info['panes']} panes)")
        except TmuxWindowNotFound as e:
            print(f"❌ Window not found: {e}")
        except TmuxCaptureError as e:
            print(f"❌ Failed to capture window content: {e}")
        except TmuxCommandError as e:
            print(f"❌ Command failed: {e}")
        
        # Test capture_window_content
        try:
            content = orchestrator.capture_window_content(session.name, window.window_index, 5)
            lines = content.strip().split('\n')
            print(f"✅ Captured {len(lines)} lines of content")
        except TmuxCaptureError as e:
            print(f"❌ Failed to capture content: {e}")
        except TmuxWindowNotFound as e:
            print(f"❌ Window not found: {e}")
            
    except TmuxError as e:
        print(f"❌ Error getting sessions: {e}")


def test_nonexistent_window():
    """Test operations on non-existent windows."""
    print("\nTesting non-existent window operations...")
    orchestrator = TmuxOrchestrator()
    
    try:
        sessions = orchestrator.get_tmux_sessions()
        if not sessions:
            print("No sessions available for testing")
            return
            
        session_name = sessions[0].name
        fake_window_index = 9999  # Unlikely to exist
        
        try:
            info = orchestrator.get_window_info(session_name, fake_window_index)
            print("❌ Expected TmuxWindowNotFound exception, but got result")
        except TmuxWindowNotFound as e:
            print(f"✅ Correctly caught TmuxWindowNotFound: {e}")
        except TmuxError as e:
            print(f"❌ Got different exception: {e}")
            
    except TmuxError as e:
        print(f"❌ Error getting sessions: {e}")


def test_send_operations():
    """Test send operations with safety mode."""
    print("\nTesting send operations (with safety mode)...")
    orchestrator = TmuxOrchestrator()
    
    # Disable safety mode for automated testing
    orchestrator.safety_mode = False
    
    try:
        sessions = orchestrator.get_tmux_sessions()
        if not sessions:
            print("No sessions available for testing")
            return
            
        session = sessions[0]
        if not session.windows:
            print("No windows available for testing")
            return
            
        window = session.windows[0]
        
        try:
            # Test sending a harmless command
            orchestrator.send_keys_to_window(session.name, window.window_index, "# Test from tmux_utils", confirm=False)
            print("✅ Successfully sent keys to window")
        except TmuxWindowNotFound as e:
            print(f"❌ Window not found: {e}")
        except TmuxCommandError as e:
            print(f"❌ Command failed: {e}")
        except TmuxPermissionDenied as e:
            print(f"❌ Permission denied: {e}")
            
    except TmuxError as e:
        print(f"❌ Error getting sessions: {e}")


def test_monitoring_functions():
    """Test monitoring functions that handle exceptions gracefully."""
    print("\nTesting monitoring functions...")
    orchestrator = TmuxOrchestrator()
    
    # Test get_all_windows_status (should handle exceptions gracefully)
    status = orchestrator.get_all_windows_status()
    if 'error' in status:
        print(f"❌ Error in status: {status['error']}")
    else:
        print(f"✅ Status retrieved for {len(status['sessions'])} sessions")
    
    # Test create_monitoring_snapshot (should handle exceptions gracefully)
    snapshot = orchestrator.create_monitoring_snapshot()
    if "ERROR:" in snapshot:
        print("❌ Snapshot contains errors")
    else:
        print("✅ Monitoring snapshot created successfully")
        print(f"   Snapshot length: {len(snapshot)} characters")


if __name__ == "__main__":
    print("🧪 Testing new exception-based error handling in tmux_utils.py")
    print("=" * 60)
    
    test_get_sessions()
    test_window_operations()
    test_nonexistent_window()
    test_send_operations()
    test_monitoring_functions()
    
    print("\n" + "=" * 60)
    print("🎉 Testing complete!")
    print("\nThe new exception-based error handling provides:")
    print("✅ Clear, specific exception types for different error conditions")
    print("✅ Informative error messages with context")
    print("✅ Proper separation of success and error paths")
    print("✅ Graceful error handling in monitoring functions")
    print("✅ Pythonic exception handling instead of return value checking")
