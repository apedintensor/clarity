# Quickstart: Fix Calendar UX

## Test Scenarios

### US1: All Unscheduled Tasks Appear in Sidebar

1. Create a goal with 4+ tasks (none scheduled). Open calendar. Verify all tasks appear in the sidebar under that goal.
2. Schedule one task by dragging it to the calendar. Verify only the remaining unscheduled tasks show in the sidebar.
3. Complete a task. Verify it no longer appears in the sidebar.

### US2: Today Is First Column

4. Open the calendar in week view. Verify today is the first (leftmost) column.
5. Check that the week shows 7 days starting from today.

### US3: Drag to Unschedule

6. Schedule a task on the calendar. Drag the event from the calendar back to the sidebar. Verify it disappears from the calendar and reappears in the unscheduled list.
7. Verify the task's date/time fields are cleared after unscheduling.

### US4: Context Menu

8. Right-click a calendar event. Verify the menu shows: Edit, Reschedule, Complete, Remove from Calendar.
9. Verify there is NO "Delete" option in the menu.
10. Select "Remove from Calendar". Verify the event disappears and the task reappears in the sidebar.

### US5: Dark Mode

11. Switch to dark mode. Open the calendar. Verify header text is readable.
12. Verify day column headers and time slot labels are visible.
13. Verify events have readable text against their colored backgrounds.
14. Verify grid lines are visible but not too bright.
