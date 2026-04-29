# PromptDoc Demo Pack

## 1) What this project does
PromptDoc generates developer documentation (README + API reference) from code snippets or tool descriptions using Anthropic's API directly in the browser.

## 2) Demo script (3-5 minutes)
1. Open the website.
2. Explain: "No backend is required; API key stays in browser local storage."
3. Paste a realistic function/class or API description.
4. Keep both outputs selected: `README.md` and `API Reference`.
5. Click **Generate Documentation**.
6. Show:
   - Structured output sections
   - Copy button
   - Download button (`documentation.md`)
7. Close with: "This markdown can be dropped directly into a GitHub repository."

## 3) Suggested demo input
```js
async function createInvoice(customerId, items, currency = 'USD') {
  if (!customerId) throw new Error('customerId is required');
  if (!Array.isArray(items) || items.length === 0) throw new Error('items are required');

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return {
    id: `inv_${Date.now()}`,
    customerId,
    currency,
    subtotal,
    tax,
    total,
    createdAt: new Date().toISOString()
  };
}
```

## 4) Pre-demo checklist
- Confirm your Anthropic API key works.
- Replace `YOUR_USERNAME` links in `index.html` with your real GitHub org/user.
- Run a quick dry run once before presenting.
- Keep one generated output pre-saved as backup.

## 5) Backup talking points
- Faster onboarding through consistent docs.
- Reduces documentation drift.
- Produces practical markdown developers can use immediately.

## 6) Deliverables during demo
- Live-generated markdown.
- Downloaded `documentation.md` file.
- This demo guide as your runbook.
