# Free local Windows read aloud — F44 / R43 / R46

Implemented a Windows x64 plain-text speech adapter using the installed .NET Framework `System.Speech` / SAPI speech engines. It supports installed voice and language enumeration, rate selection, asynchronous play, native pause/resume, stop, per-word character progress and completion. No paid speech service, cloud API, account connection, voice download or speech audio file export is implemented. Voice availability and behavior depend on installed Windows-compatible SAPI engines and the default Windows audio device; this does not expose every Windows OneCore/natural voice.

## Renderer and source integration contract

`ReadAloudWorkspace(root, {sourceProvider, highlight, announce, api})` prepares a readonly text preview before explicit Play. The scope control offers selected text, current page and whole document. Unsupported or missing text/voices produce visible errors. A partial source extraction is disclosed separately from batching. A provider `nextCursor` enables Continue reading, which prepares the next batch for review and explicit playback. It never silently restarts the first page or calls a speech service from document content.

The provider receives `{scope, cursor, maxChunks:128, maxChars:200000, maxChunkChars:4096, signal}` and returns `{chunks:[{text,page?,start?,sourceLabel?}], nextCursor?, partial?, notice?}`. Chunk text and source offsets use UTF-16 character indices. Providers must keep document/revision identity bound to the cursor, use bounded/lazy extraction, and check cancellation before and after extraction. `page` is one-based; `start` is the chunk's first source character. Native progress is translated to `{chunkIndex,page?,start:chunk.start+wordOffset,length,sourceLabel?}`. Highlight is cleared with `{clear:true}` on terminal state, stop and departure. Physical page scope in a rich document editor depends on its actual page model; a paragraph/block substitute must be disclosed by that provider.

The API methods are `speechVoices()`, `speechStart({chunks,voice,rate})`, `speechControl({sessionId,command})`, `speechRelease()` and `onSpeechEvent(callback) -> unsubscribe`. `speechStart` resolves after native startup with `{sessionId}`. Commands are only `pause`, `resume` and `stop`. Public events bind `{sessionId,type}`; progress adds `{chunkIndex,start,length}`, chunk events add `{chunkIndex}` and errors add `{message}`. The IPC owner must come from the approved application sender, never from renderer options. Main-process wiring/build integration and PDF/document source providers are owned by their integration files.

## Native boundary and ownership

`LocalSpeechService` accepts bounded plain text and source metadata only, never document paths, PDF bytes, arbitrary operations, SSML, output paths or executable arguments from the renderer. Voice IDs must come from that owner's successful installed-voice enumeration. Each batch has at most 128 chunks, 4096 characters per chunk and 200,000 characters total. The service spawns the fixed helper with shell disabled, a minimal Windows environment, a random private token and a random session ID. All native commands and events must bind that token/session. Native event schemas, chunk order, monotonic word offsets and output bounds are checked before renderer callbacks.

The helper is pinned to a deliberately reviewed source SHA-256 constant and the executable hash in its generated manifest. Linked helper paths are rejected. A per-user native mutex prevents two PDFix helper processes from owning speech simultaneously. The helper operates outside the document AppContainer because it needs Windows voice and audio-device access. Installed speech engines are trusted Windows/vendor components; PDFix implements no network retrieval or cloud speech path.

A self-assigned Windows job permits one process, caps process memory at 256 MiB and CPU time at 120 seconds, and uses kill-on-job-close. Independent checks terminate on parent death/PID reuse, a 15-second missing heartbeat or two-hour lifetime. The parent limits startup to 30 seconds. Each native line is capped at 131,072 output bytes and cumulative output at 24 MiB/100,000 events; input lines are bounded, command queues are capped and only fixed commands are accepted. Prompt/chunk changes and progress emission are serialized so late progress cannot point into a following chunk. Final state is published to the renderer only after observed process exit. If termination is not observed within the kill deadline, the service retains exclusive ownership and disables further speech until app restart.

Stopping during text extraction aborts the provider and invalidates its generation. Stopping during native startup releases the owner even before a session ID returns. Leaving the workspace aborts extraction, releases native speech, waits for pending work and removes the event listener. Text is retained in renderer memory for review/playback; parent chunk references are released at native termination. No persistent speech-text or audio output file is created.

## Verification and remaining acceptance

Allowed source checks: `node --check` on the service, build script and workspace. The Windows x64 helper compiled successfully with `/warnaserror+` using the installed Framework compiler and `System.Speech.dll` from the Windows GAC. The build writes `dist/native/speech/PDFix.Speech.exe`, its manifest and NOTICE. Vite clears `dist`; integration must compile the helper after the renderer build and include that directory in Windows packaging.

No runtime, UI, native helper execution, PDF fixture, audio playback or new test was performed or added, as requested. Installed-voice discovery, actual audible output, pronunciation/language suitability, pause/resume timing, source highlight timing, driver failure behavior, concurrent process acceptance and cancellation/adversarial runtime acceptance remain unverified. Compilation and source checks establish code/build coherence, not actual hardware/audio acceptance. Audio export, voice installation, cloud/neural synthesis, automatic language detection and OCR generation are outside this adapter's scope.

## Primary API references

- [Microsoft SpeechSynthesizer](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer?view=netframework-4.8.1)
- [SpeakAsync plain-text and Prompt overloads](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer.speakasync?view=netframework-4.8.1)
- [SpeakProgress and native word events](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer.speakprogress?view=netframework-4.8.1)
- [CharacterPosition](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speakprogresseventargs.characterposition?view=netframework-4.8.1)
- [Windows job objects and process limits](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
