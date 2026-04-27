# Handwriting Simulation Visual Test Cases

To verify that the handwriting simulation improvements are functioning correctly, perform the following visual checks using the app interface.

## Test Case 1: Pen Pressure Scaling
**Description:** Verify that the "Pen Pressure" control correctly adjusts the simulated ink thickness.
**Steps:**
1. Type a word like "Hello" repeatedly on a single line.
2. Under "Pen Pressure" in the settings, select **Low**.
3. Observe the rendered text. The thickness of the characters should remain relatively uniform.
4. Select **High**.
5. Observe the rendered text. The characters near the middle of the word should be noticeably thicker than the characters at the beginning and end, simulating heavier pen strokes. The text should remain mostly opaque, not looking like a ghosted shadow.

## Test Case 2: Per-Character Messiness & Layout Drift
**Description:** Verify that the handwriting randomness is applied organically.
**Steps:**
1. Type several sentences of text spanning multiple lines.
2. Set "Messiness" to **0.0**. The text should align perfectly to the baselines with no scaling/rotation jitter.
3. Gradually increase "Messiness" to **2.0**.
4. **Expected Observations:**
   - Individual characters should randomly vary in size (scale), slight rotation, and drift slightly off the baseline.
   - Spacing between letters should slightly widen and contract.
   - The entire line itself should exhibit slight vertical drift from the paper lines (sometimes rising above or dipping below).

## Test Case 3: Imperfect Table Rendering
**Description:** Verify that table borders are no longer perfect mathematical rectangles.
**Steps:**
1. Insert a new Table using the toolbar.
2. Add text into several cells.
3. Set "Messiness" to **1.5**.
4. **Expected Observations:**
   - The borders of the table cells should look slightly hand-drawn (each line segment has slight positional jitter at its start and end).
   - Text inside the cells should not be perfectly centered. Random padding jitter should cause slight alignment inconsistencies.

## Test Case 4: Math/Image Jitter
**Description:** Verify that KaTeX math equations undergo transformation jitter.
**Steps:**
1. Paste a mathematical formula using the `<latekatex>x = y^2</latekatex>` tag format.
2. Set "Messiness" to **1.5**.
3. **Expected Observations:**
   - The rendered equation should not sit perfectly level. It should exhibit a slight rotational tilt and small scaling variance compared to a Messiness of 0, making it look inserted by a human hand rather than a machine.
