import React from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const ExportTab = ({ group, expenses }) => {
  const exportToExcel = () => {
    if (!expenses.length) {
      alert("No expenses to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      expenses.map((e) => ({
        Title: e.title,
        Amount: e.amount,
        Currency: e.currency,
        "Paid By":
          group.members.find((m) => m.id === e.paidBy)?.name || "Unknown",
        "Expense Date": e.expenseDateTime?.toDate
          ? e.expenseDateTime.toDate().toLocaleString()
          : "Unknown",
        Notes: e.notes || "-",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${group.name}_expenses.xlsx`);
  };

  const exportToPDF = async () => {
    if (!expenses.length) {
      alert("No expenses to export!");
      return;
    }

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${group.name} - Expenses`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [
        ["Title", "Amount", "Currency", "Paid By", "Expense Date", "Notes"],
      ],
      body: expenses.map((e) => [
        e.title,
        e.amount,
        e.currency,
        group.members.find((m) => m.id === e.paidBy)?.name || "Unknown",
        e.expenseDateTime?.toDate
          ? e.expenseDateTime.toDate().toLocaleString()
          : "Unknown",
        e.notes || "-",
      ]),
      styles: { fontSize: 9 },
    });

    doc.save(`${group.name}_expenses.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-gray-400">Export your group data easily 📦</p>

      <button
        onClick={exportToExcel}
        className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold text-lg transition w-full sm:w-auto"
      >
        📊 Export to Excel
      </button>

      <button
        onClick={exportToPDF}
        className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold text-lg transition w-full sm:w-auto"
      >
        📄 Export to PDF
      </button>
    </div>
  );
};

export default ExportTab;
