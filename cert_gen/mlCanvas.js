window.mlCanvas = (() => {

    const renderWireframes = (state) => {
        const overlay = document.getElementById('ml-overlay-layer');
        const img = document.getElementById('ml-image-preview');
        const mappingContainer = document.getElementById('field-mapping-container');

        overlay.innerHTML = '';
        mappingContainer.innerHTML = '';

        if (!state.mlBoxes || state.mlBoxes.length === 0) return;

        // Force image rendering to get client dimensions
        const imgRect = img.getBoundingClientRect();

        // The image max-height is 500px, so it scales down, but retains aspect ratio.
        // We use its rendered offset relative to container if container is bigger.
        // Easiest is to measure the bounding box of the img directly
        const containerRect = overlay.parentNode.getBoundingClientRect();

        const topOffset = imgRect.top - containerRect.top;
        const leftOffset = imgRect.left - containerRect.left;
        const drawnWidth = imgRect.width;
        const drawnHeight = imgRect.height;

        state.mlBoxes.forEach((boxObj, index) => {
            // Draw box on overlay
            const div = document.createElement('div');
            div.className = 'wireframe-box';

            const b = boxObj.box;

            const top = (b.ymin * drawnHeight) + topOffset;
            const left = (b.xmin * drawnWidth) + leftOffset;
            const height = ((b.ymax - b.ymin) * drawnHeight);
            const width = ((b.xmax - b.xmin) * drawnWidth);

            div.style.top = `${top}px`;
            div.style.left = `${left}px`;
            div.style.height = `${height}px`;
            div.style.width = `${width}px`;
            div.innerText = boxObj.label;

            overlay.appendChild(div);

            // Create Field Mapping Input
            const mapRow = document.createElement('div');
            mapRow.style.marginBottom = '1rem';
            mapRow.innerHTML = `
                <label style="display:block; font-size:0.9rem; margin-bottom:0.25rem;">${boxObj.label}</label>
                <div style="display:flex; gap:0.5rem; flex-wrap: wrap; align-items:center;">
                    <input type="text" class="input-field" style="margin-bottom:0; flex: 1; padding: 0.5rem;" 
                           placeholder="CSV Header Name (e.g., Name)" id="map-${boxObj.id}" value="${boxObj.label}">
                    <select class="input-field" style="margin-bottom:0; width: 100px; padding: 0.5rem;" id="align-${boxObj.id}">
                        <option value="center">Center</option>
                        <option value="left" selected>Left</option>
                        <option value="right">Right</option>
                    </select>
                    <input type="number" class="input-field" style="margin-bottom:0; width: 80px; padding: 0.5rem;" value="40" title="Font Size" id="size-${boxObj.id}">
                    <input type="color" style="height: 38px; border:none; border-radius:4px; background:transparent; cursor:pointer;" value="#000000" id="color-${boxObj.id}" title="Text Color">
                    <button class="btn secondary-btn delete-field-btn" data-index="${index}" style="padding: 0.4rem 0.8rem;" title="Delete Field"><i class="fa-solid fa-trash" style="color:#ef4444;"></i></button>
                </div>
            `;
            mappingContainer.appendChild(mapRow);

            // Allow clicking box to highlight the input row
            div.addEventListener('click', () => {
                const mapInput = document.getElementById(`map-${boxObj.id}`);
                mapInput.focus();
                mapInput.style.borderColor = 'var(--gradient-2)';
                setTimeout(() => mapInput.style.borderColor = '', 1000);
            });
        });

        // Sync values to state live
        const syncValuesToState = () => {
            state.mlBoxes.forEach(b => {
                const mapInput = document.getElementById(`map-${b.id}`);
                const alignSelect = document.getElementById(`align-${b.id}`);
                const sizeInput = document.getElementById(`size-${b.id}`);
                const colorInput = document.getElementById(`color-${b.id}`);

                if (mapInput) b.csvKey = mapInput.value;
                if (alignSelect) b.align = alignSelect.value;
                if (sizeInput) b.fontSize = sizeInput.value;
                if (colorInput) b.color = colorInput.value;
            });
        };

        mappingContainer.addEventListener('change', syncValuesToState);
        mappingContainer.addEventListener('input', syncValuesToState); // catch color changes instantly

        syncValuesToState(); // initial sync

        // Handle deletions
        document.querySelectorAll('.delete-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = e.currentTarget.getAttribute('data-index');
                state.mlBoxes.splice(i, 1);
                renderWireframes(state); // re-render layout
            });
        });
    };

    return { renderWireframes };
})();
