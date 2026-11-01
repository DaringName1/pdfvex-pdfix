# Free app and local AI progress

The AI connections screen previously suggested `https://api.openai.com/v1`, allowed online endpoints, and accepted API keys. It now offers a local OpenAI-compatible server at `http://127.0.0.1:11434/v1` by default and no API key field. New connections must use numeric loopback `127.0.0.1` or `[::1]`. The service also rejects saved online connections for discovery and chat, and the network request layer blocks non-loopback destinations. Existing online connection entries remain visible so users can remove them. Legacy saved keys are never sent and are removed with their connection.

No payment, purchase, upgrade, billing, or subscription links were found in the inspected `src` and `desktop` code. The local server can still be configured independently to forward requests; the app tells users to review its configuration and cannot verify what that server does.

This pass is source-only. Runtime, UI, network, and test execution were not requested.
