/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

declare global {
  interface GlideGlobals {
    test_executed?: boolean;
  }
}

function toolbar_button(): HTMLElement {
  const toolbar_button = document!.getElementById(
    "glide-toolbar-keyseq-button"
  );
  ok(toolbar_button, "Toolbar keyseq button should exist");
  return toolbar_button as HTMLElement;
}

add_setup(async () => {
  GlideBrowser.key_manager.reset_sequence();

  await GlideTestUtils.reload_config(function _() {
    glide.g.test_executed = false;

    // Add a test mapping that has display_keyseq
    glide.keymaps.set(
      "normal",
      "t",
      () => {
        glide.g.test_executed = true;
      },
      { retain_key_display: true }
    );
  });

  // Clear any existing keyseq display from previous tests
  await GlideTestUtils.synthesize_keyseq("<escape>");
  const existing_span = document!.getElementById("glide-toolbar-keyseq-span");
  if (existing_span) {
    existing_span.textContent = "";
  }

  await sleep_frames(1);
});

add_task(async function test_keyseq_display_element_creation() {
  is(toolbar_button().textContent, "", "Initially keyseq should be empty");

  // Press 't' which has display_keyseq: true
  await GlideTestUtils.synthesize_keyseq("t");
  is(toolbar_button().textContent, "t", "Keyseq span should display 't'");
});

add_task(async function test_keyseq_display_multi_key_sequence() {
  await GlideTestUtils.synthesize_keyseq("<escape>");

  EventUtils.synthesizeKey("g");
  await sleep_frames(2);

  let keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(keyseq_span!.textContent, "g", "Should display 'g' for first key");

  EventUtils.synthesizeKey("g");
  await sleep_frames(2);

  keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(
    keyseq_span!.textContent,
    "",
    "Should clear display after completing 'gg' mapping"
  );
});

add_task(async function test_keyseq_op_pending() {
  EventUtils.synthesizeKey("d");
  await sleep_frames(2);

  let keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(keyseq_span!.textContent, "d", "Should display 'd'");

  EventUtils.synthesizeKey("w");
  await sleep_frames(2);

  keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(
    keyseq_span!.textContent,
    "",
    "Keyseq should be cleared after complete operation"
  );
  is(GlideBrowser.state.mode, "normal", "Should return to normal mode");
});

add_task(async function test_keyseq_display_clears_on_invalid_sequence() {
  EventUtils.synthesizeKey("g");
  await sleep_frames(2);

  let keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(keyseq_span!.textContent, "g", "Should display 'g'");

  EventUtils.synthesizeKey("x");
  await sleep_frames(2);

  keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(
    keyseq_span!.textContent,
    "",
    "Keyseq should be cleared after invalid key"
  );
});

add_task(async function test_keyseq_display_with_op_pending_mode() {
  // Test with operator-pending mode which shows keyseq
  GlideBrowser.api.g.test_executed = false;

  EventUtils.synthesizeKey("d");
  await sleep_frames(2);

  let keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(keyseq_span!.textContent, "d", "Should display 'd' in op-pending mode");
  is(GlideBrowser.state.mode, "op-pending", "Should be in op-pending mode");

  // Cancel with escape
  EventUtils.synthesizeKey("KEY_Escape");
  await sleep_frames(2);

  keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(keyseq_span!.textContent, "", "Keyseq should be cleared after escape");
  is(GlideBrowser.state.mode, "normal", "Should return to normal mode");
});

add_task(async function test_keyseq_display_without_toolbar_button() {
  // emulate user customised toolbar and removed the element
  const original_button = document!.getElementById(
    "glide-toolbar-keyseq-button"
  );
  original_button!.remove();

  // This should not throw an error
  EventUtils.synthesizeKey("g");
  await sleep_frames(2);

  const keyseq_span = document!.getElementById("glide-toolbar-keyseq-span");
  is(
    keyseq_span,
    null,
    "No keyseq span should be created when toolbar button is missing"
  );

  // Restore the button for other tests
  document!.body!.appendChild(original_button!);
});
