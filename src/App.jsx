import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import "./App.css";

export default function App() {
  const invoiceRef = useRef(null);

  const [company, setCompany] = useState({
    name: "Invora",
    org: "Org.nr 000 000 000 MVA",
    address: "Street 1, 4000 Stavanger",
    email: "contact@invora.app",
    account: "",
    iban: "",
  });

  const [client, setClient] = useState("");
  const [kid, setKid] = useState("");
  const [terms, setTerms] = useState("Payment due within 14 days.");
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [savedInvoices, setSavedInvoices] = useState([]);

  const [items, setItems] = useState([
    { id: Date.now(), description: "", quantity: "", price: "" },
  ]);

  useEffect(() => {
    const savedCompany = localStorage.getItem("invora-company");
    const savedNumber = localStorage.getItem("invora-invoice-number");
    const saved = localStorage.getItem("invora-saved-invoices");

    if (savedCompany) setCompany(JSON.parse(savedCompany));
    if (savedNumber) setInvoiceNumber(Number(savedNumber));
    if (saved) setSavedInvoices(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("invora-company", JSON.stringify(company));
  }, [company]);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );

  const vat = subtotal * 0.25;
  const total = subtotal + vat;
  const invoiceCode = `INV-${String(invoiceNumber).padStart(3, "0")}`;

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(issueDate.getDate() + 14);

  function money(value) {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(value || 0);
  }

  function updateCompany(field, value) {
    setCompany({ ...company, [field]: value });
  }

  function addItem() {
    setItems([...items, { id: Date.now(), description: "", quantity: "", price: "" }]);
  }

  function updateItem(id, field, value) {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function removeItem(id) {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  }

  function saveInvoice() {
    const invoice = {
      id: Date.now(),
      invoiceNumber,
      invoiceCode,
      client,
      kid,
      terms,
      items,
      total,
      date: issueDate.toLocaleDateString("nb-NO"),
    };

    const updated = [invoice, ...savedInvoices];
    setSavedInvoices(updated);
    localStorage.setItem("invora-saved-invoices", JSON.stringify(updated));
  }

  function loadInvoice(invoice) {
    setInvoiceNumber(invoice.invoiceNumber);
    setClient(invoice.client);
    setKid(invoice.kid);
    setTerms(invoice.terms);
    setItems(invoice.items);
  }

  function deleteInvoice(id) {
    const updated = savedInvoices.filter((invoice) => invoice.id !== id);
    setSavedInvoices(updated);
    localStorage.setItem("invora-saved-invoices", JSON.stringify(updated));
  }

  function newInvoice() {
    const next = invoiceNumber + 1;
    setInvoiceNumber(next);
    localStorage.setItem("invora-invoice-number", String(next));

    setClient("");
    setKid("");
    setTerms("Payment due within 14 days.");
    setItems([{ id: Date.now(), description: "", quantity: "", price: "" }]);
  }

  function downloadPDF() {
    html2pdf()
      .set({
        margin: 0,
        filename: `${invoiceCode}-${client || "invoice"}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(invoiceRef.current)
      .save();
  }

  return (
    <div className="page">
      <div className="hero no-print">
        <div className="brand-logo">◆ Invora</div>
        <h1>Invoices done right</h1>
        <p>Professional invoice generator for small businesses.</p>
      </div>

      <div className="app">
        <div className="panel no-print">
          <h2>Invoice</h2>

          <div className="mini">
            <b>{invoiceCode}</b>
            <span>Issue: {issueDate.toLocaleDateString("nb-NO")}</span>
            <span>Due: {dueDate.toLocaleDateString("nb-NO")}</span>
          </div>

          <label>Client name</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} />

          <label>KID</label>
          <input value={kid} onChange={(e) => setKid(e.target.value)} />

          <label>Payment terms</label>
          <input value={terms} onChange={(e) => setTerms(e.target.value)} />

          <h3>Company settings</h3>

          <label>Company name</label>
          <input value={company.name} onChange={(e) => updateCompany("name", e.target.value)} />

          <label>Org number</label>
          <input value={company.org} onChange={(e) => updateCompany("org", e.target.value)} />

          <label>Address</label>
          <input value={company.address} onChange={(e) => updateCompany("address", e.target.value)} />

          <label>Email</label>
          <input value={company.email} onChange={(e) => updateCompany("email", e.target.value)} />

          <label>Account number</label>
          <input value={company.account} onChange={(e) => updateCompany("account", e.target.value)} />

          <label>IBAN</label>
          <input value={company.iban} onChange={(e) => updateCompany("iban", e.target.value)} />

          <div className="items-title">
            <h3>Items</h3>
            <button className="small" onClick={addItem}>+ Add</button>
          </div>

          {items.map((item, index) => (
            <div className="item" key={item.id}>
              <div className="item-top">
                <b>Item {index + 1}</b>
                <button className="danger" onClick={() => removeItem(item.id)}>Remove</button>
              </div>

              <label>Description</label>
              <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />

              <div className="grid">
                <div>
                  <label>Qty</label>
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} />
                </div>
                <div>
                  <label>Price</label>
                  <input type="number" value={item.price} onChange={(e) => updateItem(item.id, "price", e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={downloadPDF}>Download PDF</button>
          <button className="secondary" onClick={saveInvoice}>Save invoice</button>
          <button className="secondary" onClick={newInvoice}>New invoice / next number</button>

          <div className="saved">
            <h3>Saved invoices</h3>
            {savedInvoices.length === 0 && <p>No saved invoices.</p>}
            {savedInvoices.map((invoice) => (
              <div className="saved-item" key={invoice.id}>
                <div onClick={() => loadInvoice(invoice)}>
                  <b>{invoice.invoiceCode}</b>
                  <span>{invoice.client} • {money(invoice.total)}</span>
                </div>
                <button onClick={() => deleteInvoice(invoice.id)}>X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="invoice" ref={invoiceRef}>
          <div className="invoice-header">
            <div>
              <h2>{company.name}</h2>
              <p>{company.org}</p>
              <p>{company.address}</p>
              <p>{company.email}</p>
            </div>

            <div className="right">
              <h3>Invoice #{invoiceCode}</h3>
              <p>Issue date: {issueDate.toLocaleDateString("nb-NO")}</p>
              <p>Due date: {dueDate.toLocaleDateString("nb-NO")}</p>
            </div>
          </div>

          <div className="bill-box">
            <span>Bill to</span>
            <h3>{client}</h3>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const lineTotal = Number(item.quantity || 0) * Number(item.price || 0);

                return (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price ? money(Number(item.price)) : ""}</td>
                    <td>{lineTotal > 0 ? money(lineTotal) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="totals">
            <p><span>Subtotal</span><b>{subtotal > 0 ? money(subtotal) : ""}</b></p>
            <p><span>VAT 25%</span><b>{vat > 0 ? money(vat) : ""}</b></p>
            <h3><span>Total</span><b>{total > 0 ? money(total) : ""}</b></h3>
          </div>

          <div className="payment">
            <h3>Payment information</h3>
            <p><b>KID:</b> {kid}</p>
            <p><b>Account:</b> {company.account}</p>
            <p><b>IBAN:</b> {company.iban}</p>
            <p>{terms}</p>
          </div>
        </div>
      </div>
    </div>
  );
}