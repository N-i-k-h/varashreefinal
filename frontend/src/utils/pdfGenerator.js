import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= NUMBER → WORDS ================= */
export function convertToWords(num) {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const c = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    const inWords = (n) => {
        if (n < 10) return a[n];
        if (n < 20) return c[n - 10];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
        if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
        return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
    };

    if (num === 0) return "Zero";
    return inWords(Math.floor(num)).trim() + " Rupees Only";
}

/* ================= IMAGE LOADER ================= */
const loadImageBase64 = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (err) => reject(err);
        img.src = url;
    });
};

/* ================= SHARED HEADER ================= */
const addHeader = (doc, title, entity, isFirstPage, logoBase64) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Outer Border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    if (isFirstPage) {
        // Logo
        if (logoBase64) {
            try {
                doc.addImage(logoBase64, "PNG", 15, 15, 30, 0);
            } catch (e) {
                console.warn("Logo failed to render in PDF", e);
            }
        } else {
            try {
                doc.addImage("/logo.png", "PNG", 15, 15, 30, 0);
            } catch (e) {
                console.warn("Logo URL fallback failed", e);
            }
        }

        // Company Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("VARASHREE FARM & NURSERY", pageWidth / 2 + 10, 25, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const headerLines = [
            "Approved by Department of Horticulture, Government of Karnataka & Government of India",
            "Spice Board & NHB Approved 3 Star Nursery",
            "Sakrebyle, Gajanur Post, Shimoga Tq. & Dist, Karnataka",
            "Mob: 7892326717, 9449742477 | Email: varashreenursery10@gmail.com"
        ];
        headerLines.forEach((line, i) => {
            doc.text(line, pageWidth / 2 + 10, 33 + (i * 4), { align: "center" });
        });

        // Title Section (Boxed)
        doc.setLineWidth(0.3);
        doc.rect(10, 52, pageWidth - 20, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title, pageWidth / 2, 60, { align: "center" });

        // General Info
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        let yPos = 75;
        
        if (title === "INVOICE") {
            doc.text(`Invoice No : ${entity.orderNo}`, 15, yPos);
            doc.text(`Date : ${new Date(entity.createdAt).toLocaleDateString("en-IN")}`, pageWidth - 15, yPos, { align: "right" });
            yPos += 8;
            doc.text(`Customer Name : ${entity.customerName}`, 15, yPos);
            doc.text(`Payment Mode : ${entity.paymentMethod || "Cash"}`, pageWidth - 15, yPos, { align: "right" });
            yPos += 8;
            doc.text(`Contact : ${entity.customerContact || "-"}`, 15, yPos);
            yPos += 8;
            doc.text(`Address : ${entity.customerAddress || "-"}`, 15, yPos);
            doc.text(`Attended By : ${entity.employeeName || "-"}`, pageWidth - 15, yPos, { align: "right" });
        } else {
            doc.text(`Estimate No : ${entity.estimateNo}`, 15, yPos);
            doc.text(`Date : ${new Date(entity.createdAt).toLocaleDateString("en-IN")}`, pageWidth - 15, yPos, { align: "right" });
            yPos += 8;
            doc.text(`Customer Name : ${entity.customerName}`, 15, yPos);
            yPos += 8;
            doc.text(`Contact : ${entity.customerContact || "-"}`, 15, yPos);
            yPos += 8;
            doc.text(`Address : ${entity.customerAddress || "-"}`, 15, yPos);
        }
    }
};

/* ================= GENERATE PDF ================= */
export const generatePDF = async (type, entity, items) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const title = type === "order" ? "INVOICE" : "ESTIMATE";

    let logoBase64 = null;
    try {
        logoBase64 = await loadImageBase64("/logo.png");
    } catch (e) {
        console.warn("Failed to load logo base64", e);
    }

    addHeader(doc, title, entity, true, logoBase64);

    const tableData = items.map((it, i) => [
        i + 1,
        it.plantName,
        it.quantity,
        it.rate.toFixed(2),
        it.total.toFixed(2)
    ]);

    autoTable(doc, {
        startY: 115,
        head: [["No", "Particulars", "Qty", "Rate", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [0, 0, 0], 
            fontStyle: "bold", 
            lineWidth: 0.3, 
            halign: 'center' 
        },
        styles: { 
            fontSize: 10, 
            cellPadding: 4,
            lineColor: [0, 0, 0],
            lineWidth: 0.3
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' },
        },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, title, entity, false, logoBase64);
            }
        },
        margin: { top: 15, bottom: 15, left: 10, right: 10 }
    });

    let finalY = doc.lastAutoTable.finalY + 12;
    const totalPlants = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Check space for totals
    if (type === "order") {
        if (finalY + 66 > pageHeight) {
            doc.addPage();
            addHeader(doc, title, entity, false, logoBase64);
            finalY = 25;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Plants : ${totalPlants}`, pageWidth - 15, finalY, { align: "right" });
        finalY += 6;
        doc.text(`Subtotal : Rs. ${entity.subTotal.toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });
        finalY += 6;
        if (entity.discount > 0) {
            doc.text(`Discount : Rs. ${entity.discount.toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });
            finalY += 6;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Grand Total : Rs. ${entity.grandTotal.toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });
        finalY += 6;
        doc.text(`Paid Amount : Rs. ${(entity.paidAmount || 0).toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });
        finalY += 6;
        doc.setTextColor(200, 0, 0);
        doc.text(`Balance Due : Rs. ${(entity.balanceAmount || 0).toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });
        doc.setTextColor(0, 0, 0);
        
        finalY += 15;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(`Amount in words: ${convertToWords(entity.grandTotal)}`, pageWidth / 2, finalY, { align: "center" });
        finalY += 10;
        doc.setFont("helvetica", "normal");
        doc.text("Note: Plants once sold cannot be replaced or exchanged.", pageWidth / 2, finalY, { align: "center" });
        finalY += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Thank you for your business!", pageWidth / 2, finalY, { align: "center" });

        // Signature
        finalY += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("For VARASHREE FARM & NURSERY", pageWidth - 15, finalY, { align: "right" });
        finalY += 15;
        doc.text("Authorized Signatory", pageWidth - 15, finalY, { align: "right" });

    } else {
        if (finalY + 46 > pageHeight) {
            doc.addPage();
            addHeader(doc, title, entity, false, logoBase64);
            finalY = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Total Plants : ${totalPlants}`, pageWidth - 15, finalY, { align: "right" });
        finalY += 6;
        doc.setFontSize(12);
        doc.text(`Estimated Cost : Rs. ${entity.grandTotal.toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });
        
        finalY += 15;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(`Amount in words: ${convertToWords(entity.grandTotal)}`, pageWidth / 2, finalY, { align: "center" });
        finalY += 10;
        doc.setFont("helvetica", "normal");
        doc.text("This is an estimate only. Prices may change.", pageWidth / 2, finalY, { align: "center" });
    }

    doc.save(`${title}_${entity.orderNo || entity.estimateNo}.pdf`);
};
