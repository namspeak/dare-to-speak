(function () {
  'use strict';
  var PRICE = 189000;
  var D = window.SPEAK_DEMO || { toc: [], sample: [], readerNotice: '' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var money = function (n) { return n.toLocaleString('vi-VN') + 'đ'; };

  /* Dialogs */
  function openDialog(id) {
    var d = document.getElementById(id);
    if (!d || typeof d.showModal !== 'function') return;
    if (!d.open) d.showModal();
    document.body.classList.add('dialog-open');
  }
  function closeDialog(id) {
    var d = document.getElementById(id);
    if (d && d.open) d.close();
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open-dialog]');
    if (o) { openDialog(o.getAttribute('data-open-dialog')); return; }
    var c = e.target.closest('[data-close-dialog]');
    if (c) { closeDialog(c.getAttribute('data-close-dialog')); return; }
    if (e.target.tagName === 'DIALOG') e.target.close(); // click ra ngoài
  });
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('close', function () {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    });
  });

  /* Mục lục demo */
  var toc = $('#table-of-contents');
  if (toc) {
    D.toc.forEach(function (g) {
      var head = document.createElement('div'); head.className = 'toc-group';
      var hp = document.createElement('span'); hp.textContent = g.part;
      var ht = document.createElement('b'); ht.textContent = g.title;
      head.appendChild(hp); head.appendChild(ht); toc.appendChild(head);
      g.chapters.forEach(function (c) {
        var row = document.createElement('div'); row.className = 'toc-item';
        var part = document.createElement('span'); part.className = 'toc-part'; part.textContent = c[0];
        var box = document.createElement('div');
        var h = document.createElement('h3'); h.textContent = c[1];
        var p = document.createElement('p'); p.textContent = c[2];
        box.appendChild(h); box.appendChild(p); row.appendChild(part); row.appendChild(box); toc.appendChild(row);
      });
    });
  }

  /* Đọc thử demo */
  var sample = $('#sample-content');
  if (sample) {
    D.sample.forEach(function (b) {
      var el = document.createElement(b.h ? 'h3' : 'p'); el.textContent = b.h || b.p; sample.appendChild(el);
    });
  }
  var notice = $('#reader-notice'); if (notice) notice.textContent = D.readerNotice;
  var pf = $('#preview-form');
  if (pf) {
    var pe = $('#preview-email'), ps = $('#preview-status');
    pf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!pe.checkValidity()) { ps.className = 'form-status'; ps.textContent = 'Vui lòng nhập email hợp lệ.'; pe.focus(); return; }
      ps.className = 'form-status ok'; ps.textContent = 'Đang mở bản đọc thử…';
      openDialog('reading-dialog');
    });
  }

  /* Đặt sách demo */
  var qty = $('#quantity');
  function getQty() { var n = parseInt(qty.value, 10); return isFinite(n) && n >= 1 ? Math.min(n, 999) : 1; }
  function updateTotals() {
    var n = getQty(), sub = n * PRICE;
    $('#summary-quantity').textContent = '× ' + n;
    $('#subtotal').textContent = money(sub);
    $('#order-total').innerHTML = money(sub) + ' <small>+ phí giao</small>';
  }
  if (qty) {
    $('#quantity-minus').addEventListener('click', function () { qty.value = Math.max(1, getQty() - 1); updateTotals(); });
    $('#quantity-plus').addEventListener('click', function () { qty.value = getQty() + 1; updateTotals(); });
    qty.addEventListener('input', updateTotals);
    qty.addEventListener('blur', function () { qty.value = getQty(); updateTotals(); });
    updateTotals();
  }

  var form = $('#order-form');
  if (form) {
    var rules = {
      name: { id: 'customer-name', err: 'name-error', msg: 'Vui lòng nhập họ tên người nhận.', ok: function (v) { return v.trim().length >= 2; } },
      phone: { id: 'customer-phone', err: 'phone-error', msg: 'Số điện thoại chưa hợp lệ (9–11 chữ số).', ok: function (v) { var d = v.replace(/[\s.\-()+]/g, ''); return /^\d{9,11}$/.test(d); } },
      address: { id: 'customer-address', err: 'address-error', msg: 'Vui lòng nhập địa chỉ nhận sách.', ok: function (v) { return v.trim().length >= 6; } }
    };
    function check(k) {
      var r = rules[k], el = document.getElementById(r.id), er = document.getElementById(r.err), good = r.ok(el.value);
      el.setAttribute('aria-invalid', good ? 'false' : 'true'); er.textContent = good ? '' : r.msg; return good;
    }
    Object.keys(rules).forEach(function (k) { document.getElementById(rules[k].id).addEventListener('blur', function () { check(k); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = $('#order-status'), allOk = true, first = null;
      Object.keys(rules).forEach(function (k) { if (!check(k)) { allOk = false; first = first || document.getElementById(rules[k].id); } });
      if (!allOk) { st.className = 'form-status'; st.textContent = 'Vui lòng kiểm tra lại các trường được đánh dấu.'; first.focus(); return; }
      st.textContent = '';
      var n = getQty(), dl = $('#confirmation-details'); dl.textContent = '';
      [['Người nhận', $('#customer-name').value.trim()], ['Điện thoại', $('#customer-phone').value.trim()],
       ['Địa chỉ', $('#customer-address').value.trim()], ['Ghi chú', $('#customer-note').value.trim() || '—'],
       ['Số lượng', n + ' cuốn'], ['Tiền sách', money(n * PRICE) + ' (+ phí giao)']].forEach(function (r) {
        var row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1]; row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
      });
      closeDialog('order-dialog'); openDialog('confirmation-dialog');
    });
  }
})();
