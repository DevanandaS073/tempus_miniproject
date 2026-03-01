window.pdfGen = (() => {

    // Internal generic HTML renderer to preview
    const renderCertificateToDOM = (record, templateType, isPreview = false) => {
        const wrap = document.createElement('div');
        // We set fixed size for true scale, scaled via CSS for preview
        const A4_WIDTH = 1123; // standard 300dpi A4 Landscape pixels approx
        const A4_HEIGHT = 794;

        wrap.style.width = isPreview ? '100%' : `${A4_WIDTH}px`;
        wrap.style.height = isPreview ? '100%' : `${A4_HEIGHT}px`;
        wrap.style.position = 'relative';
        wrap.style.backgroundColor = '#ffffff';
        wrap.style.overflow = 'hidden';

        if (!isPreview) {
            wrap.style.position = 'fixed';
            wrap.style.left = '-9999px';
            wrap.style.top = '-9999px';
        } else {
            // scale down nicely for preview
            wrap.style.aspectRatio = "1.414/1";
        }

        if (templateType === 'custom_html') {
            const rawTemplate = localStorage.getItem('certigen_custom_html_template');
            if (rawTemplate) {
                let htmlStr = rawTemplate;

                // Extremely simple fuzzy replacement for our placeholders using the CSV data
                // {{name}}, {{course}}, {{date}}, {{grade}}
                if (record) {
                    const keys = Object.keys(record);

                    // Replace {{name}} with record Name/name
                    const nameKey = keys.find(k => k.toLowerCase() === 'name');
                    if (nameKey) htmlStr = htmlStr.replace(/\{\{\s*name\s*\}\}/gi, record[nameKey]);

                    // Replace {{course}}
                    const courseKey = keys.find(k => k.toLowerCase() === 'course');
                    if (courseKey) htmlStr = htmlStr.replace(/\{\{\s*course\s*\}\}/gi, record[courseKey]);

                    // Replace {{date}}
                    const dateKey = keys.find(k => k.toLowerCase() === 'date');
                    if (dateKey) htmlStr = htmlStr.replace(/\{\{\s*date\s*\}\}/gi, record[dateKey]);

                    // Replace {{grade}}
                    const gradeKey = keys.find(k => k.toLowerCase() === 'grade');
                    if (gradeKey) htmlStr = htmlStr.replace(/\{\{\s*grade\s*\}\}/gi, record[gradeKey]);
                }

                // Fallbacks if missing
                htmlStr = htmlStr.replace(/\{\{\s*name\s*\}\}/gi, "[Name]");
                htmlStr = htmlStr.replace(/\{\{\s*course\s*\}\}/gi, "[Course]");
                htmlStr = htmlStr.replace(/\{\{\s*date\s*\}\}/gi, "[Date]");
                htmlStr = htmlStr.replace(/\{\{\s*grade\s*\}\}/gi, "[Grade]");

                wrap.innerHTML = htmlStr;
            } else {
                wrap.innerHTML = `<div style="padding:2rem;color:black;">No Custom HTML Template found. Please create one in the AI Editor.</div>`;
            }
        } else {
            // Built-in templates
            let bgColor = '#f8fafc';
            let titleColor = '#1e293b';
            let border = '20px solid #3b82f6';

            if (templateType === 'classic_elegant') { bgColor = '#fdfbf7'; border = '20px solid #d4af37'; titleColor = '#4a0e4e'; }
            if (templateType === 'corporate_bold') { bgColor = '#ffffff'; border = '30px solid #0f172a'; titleColor = '#000000'; }

            wrap.style.backgroundColor = bgColor;
            wrap.style.border = border;
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.justifyContent = 'center';
            wrap.style.alignItems = 'center';
            wrap.style.textAlign = 'center';
            wrap.style.padding = '40px';
            wrap.style.fontFamily = "'Outfit', sans-serif";

            wrap.innerHTML = `
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; width: 100%;">
                    <h1 style="font-size: ${isPreview ? '1.5rem' : '60px'}; color: ${titleColor}; margin-bottom: 5px;">CERTIFICATE OF ACHIEVEMENT</h1>
                    <p style="font-size: ${isPreview ? '0.8rem' : '24px'}; color: #64748b; margin-bottom: ${isPreview ? '10px' : '40px'};">This is proudly presented to</p>
                    <h2 style="font-size: ${isPreview ? '2rem' : '80px'}; color: ${titleColor}; margin-bottom: ${isPreview ? '10px' : '40px'}; border-bottom: 2px solid ${titleColor}; padding-bottom: 10px;">${record ? (record.Name || record.name || '{Name}') : '{Name}'}</h2>
                    <p style="font-size: ${isPreview ? '0.8rem' : '24px'}; color: #64748b; width: 80%; line-height: 1.5; margin-bottom: ${isPreview ? '10px' : '60px'};">For the successful completion of the required course of study and demonstrating excellence in <b>${record ? (record.Course || record.course || '{Course}') : '{Course}'}</b>.</p>
                    <div style="display:flex; justify-content: space-between; width: 80%; margin-top: ${isPreview ? '10px' : '40px'};">
                        <div style="text-align:center;">
                            <div style="border-bottom: 2px solid #cbd5e1; width: ${isPreview ? '80px' : '200px'}; height: ${isPreview ? '20px' : '60px'};"></div>
                            <p style="font-size: ${isPreview ? '0.7rem' : '20px'}; color: #64748b; margin-top: 5px;">Date: ${record ? (record.Date || record.date || '{Date}') : '{Date}'}</p>
                        </div>
                        <div style="text-align:center;">
                            <div style="border-bottom: 2px solid #cbd5e1; width: ${isPreview ? '80px' : '200px'}; height: ${isPreview ? '20px' : '60px'};"></div>
                            <p style="font-size: ${isPreview ? '0.7rem' : '20px'}; color: #64748b; margin-top: 5px;">Signature</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return wrap;
    };

    const renderPreview = (state) => {
        const previewEl = document.getElementById('certificate-preview');
        previewEl.innerHTML = '';
        const dataPreview = state.csvData && state.csvData.length > 0 ? state.csvData[0] : null;

        const domView = renderCertificateToDOM(dataPreview, state.currentTemplate, true);
        domView.style.containerType = 'inline-size'; // for inline query fallback scaling
        previewEl.appendChild(domView);
    };

    const generateAll = async (state) => {
        const { jsPDF } = window.jspdf;
        // Landscape A4 PDF
        const pdf = new jsPDF('l', 'px', 'a4');
        const A4_WIDTH = pdf.internal.pageSize.getWidth();
        const A4_HEIGHT = pdf.internal.pageSize.getHeight();

        const records = state.csvData;

        if (!records || records.length === 0) {
            throw new Error("No CSV data to generate.");
        }

        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            // Render full scale DOM offscreen
            const domEl = renderCertificateToDOM(record, state.currentTemplate, false);
            document.body.appendChild(domEl);

            // Wait a tick for browser paints
            await new Promise(r => setTimeout(r, 100));

            // Capture image
            const canvas = await html2canvas(domEl, {
                scale: 2, // 2x resolution
                useCORS: true,
                backgroundColor: null,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            if (i > 0) pdf.addPage();

            pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);

            // Cleanup DOM
            document.body.removeChild(domEl);
        }

        // Trigger Download
        pdf.save('certificates.pdf');
    };

    return { renderPreview, generateAll };
})();
