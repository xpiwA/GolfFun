(() => {
    const form = document.querySelector('#golffun-settings');
    if (!form) return;
    let dirty = false;
    const status = document.querySelector('[data-gf-dirty]');
    form.addEventListener('change', () => {
        dirty = true;
        status.textContent = 'Du har osparade ändringar.';
        status.classList.add('is-dirty');
    });
    form.addEventListener('submit', () => { dirty = false; });
    window.addEventListener('beforeunload', event => {
        if (dirty) { event.preventDefault(); event.returnValue = ''; }
    });
    document.querySelector('[data-gf-copy]')?.addEventListener('click', async () => {
        const output = document.querySelector('.gfa-copy-status');
        try {
            await navigator.clipboard.writeText('[golffun]');
            output.textContent = '✓ Kortkoden är kopierad.';
        } catch {
            output.textContent = 'Markera och kopiera koden: [golffun]';
        }
    });
})();
