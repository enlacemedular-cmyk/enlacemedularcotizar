<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use the shared MedularSignature capture API for every document type, registering a separate draft field per type; this keeps touch behavior consistent and signatures isolated.
- Keep client signatures in the original editable document state and render them through the shared image helper; new and cloned documents must not inherit acceptance signatures.
