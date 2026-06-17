// ============================================================
// SSC Answer Key Cleaner - Paste in Browser Console
// ============================================================
// 1. Removes watermark
// 2. Hides Roll No, Candidate Name, Centre Name from top
// 3. Removes green/yellow/red bg colors from option cells
// 4. Adds bold BLACK numbers 1-4 to left of ALL 4 options
// 5. On correct option: number + "Correct ✔" (black)
//    On wrong selected: number + "✗ Wrong" (black)
// 6. After option 4: "Correct Answer: (X)" row (copyable)
// 7. After "Correct Answer" row: Hindi version box showing
//    all question + option images in Hindi (same layout)
// 8. Unblocks Ctrl+P and opens print dialog
//
// Hindi image URL logic:
//   EN: qimg/3/EN/UUID_EN.jpg?edu=XXX
//   HI: qimg/3/HI/UUID_HI.jpg?edu=XXX
//   (just replace /EN/ → /HI/ and _EN. → _HI.)
// ============================================================

(function () {

  // ── 1. Remove watermark ──────────────────────────────────
  document.querySelectorAll('.watermark-container, .watermark-text').forEach(function(el) { el.remove(); });
  var lbl = document.getElementById('lblWatermark');
  if (lbl) lbl.remove();
  var styleWM = document.createElement('style');
  styleWM.textContent = '.watermark-container,.watermark-text{display:none!important}';
  document.head.appendChild(styleWM);

  // ── 2. Hide Roll No / Candidate Name / Centre rows ───────
  document.querySelectorAll('td.bld').forEach(function(td) {
    var t = (td.innerText || '').trim();
    if (/^Roll\s*No/i.test(t) || /^Candidate\s*Name/i.test(t) || /^Centre/i.test(t)) {
      var row = td.closest('tr');
      if (row) row.style.display = 'none';
    }
  });

  // ── Helper: convert EN image URL → HI image URL ──────────
  function toHindi(src) {
    // qimg/3/EN/UUID_EN.jpg?edu=XXX  →  qimg/3/HI/UUID_HI.jpg?edu=XXX
    return src.replace('/EN/', '/HI/').replace('_EN.', '_HI.');
  }

  // ── 3-7: Process each question table ─────────────────────
  var allTables = document.querySelectorAll('table[border="1"]');

  allTables.forEach(function(table) {
    var allRows = Array.from(table.querySelectorAll('tr'));

    // ── Find question row (first td: width=2%, valign=top) ──
    var questionRow = null;
    allRows.forEach(function(row) {
      var firstTd = row.querySelector('td');
      if (!firstTd) return;
      if ((firstTd.getAttribute('width') || '').trim() === '2%' &&
          (firstTd.getAttribute('valign') || '').toLowerCase() === 'top') {
        questionRow = row;
      }
    });

    // ── Find all 4 option rows (width=2%, no valign=top) ───
    var optionRows = [];
    allRows.forEach(function(row) {
      var firstTd = row.querySelector('td');
      if (!firstTd) return;
      var w      = (firstTd.getAttribute('width')  || '').trim();
      var vAlign = (firstTd.getAttribute('valign') || '').toLowerCase();
      if (w === '2%' && vAlign !== 'top') {
        optionRows.push(row);
      }
    });

    if (optionRows.length !== 4) return; // not a valid question table

    var correctOptionNum = null;

    // ── Collect EN image srcs for question + 4 options ─────
    // question image = first img in questionRow's second td
    var questionImgSrc = '';
    if (questionRow) {
      var qImg = questionRow.querySelector('td:nth-child(2) img, td + td img');
      if (qImg) questionImgSrc = qImg.getAttribute('src') || '';
    }

    var optionImgSrcs = []; // array of 4 src strings

    optionRows.forEach(function(row, index) {
      var optionNum = index + 1;
      var firstTd  = row.querySelector('td');
      if (!firstTd) return;

      var color = (firstTd.getAttribute('bgcolor') || '').toLowerCase();
      if (color === 'green' || color === 'yellow') correctOptionNum = optionNum;

      // Collect option image src
      var optImg = row.querySelector('td:nth-child(2) img, td + td img');
      optionImgSrcs.push(optImg ? (optImg.getAttribute('src') || '') : '');

      // ── 3. Remove background color ─────────────────────
      firstTd.removeAttribute('bgcolor');
      firstTd.style.backgroundColor = '';
      firstTd.style.background = 'none';

      // ── 4 & 5. Add numbering + labels ──────────────────
      firstTd.style.minWidth      = '28px';
      firstTd.style.textAlign     = 'center';
      firstTd.style.verticalAlign = 'middle';
      firstTd.style.padding       = '2px 3px';

      if (color === 'green' || color === 'yellow') {
        firstTd.innerHTML =
          '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">' +
            '<span style="font-size:14px;font-weight:900;color:#000;font-family:Arial;">' + optionNum + '</span>' +
            '<span style="font-size:10px;font-weight:800;color:#000;white-space:nowrap;font-family:Arial;line-height:1.2;user-select:text;">Correct ✔</span>' +
          '</div>';
      } else if (color === 'red') {
        firstTd.innerHTML =
          '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">' +
            '<span style="font-size:14px;font-weight:900;color:#000;font-family:Arial;">' + optionNum + '</span>' +
            '<span style="font-size:10px;font-weight:800;color:#000;white-space:nowrap;font-family:Arial;line-height:1.2;user-select:text;">✗ Wrong</span>' +
          '</div>';
      } else {
        firstTd.innerHTML =
          '<span style="font-size:14px;font-weight:900;color:#000;font-family:Arial;">' + optionNum + '</span>';
      }
    });

    var lastOptionRow = optionRows[3];
    var tbody = table.querySelector('tbody') || table;
    var insertAfter = lastOptionRow.nextSibling; // reference for insertions

    // ── 6. Insert "Correct Answer: (X)" row ────────────────
    if (correctOptionNum !== null) {
      var answerTd = document.createElement('td');
      answerTd.setAttribute('colspan', '10');
      answerTd.style.padding   = '7px 14px';
      answerTd.style.borderTop = '2px solid #222';
      answerTd.innerHTML =
        '<span style="display:inline-block;border:2px solid #000;border-radius:5px;' +
        'padding:4px 16px;font-family:Arial,sans-serif;font-size:14px;font-weight:900;' +
        'color:#000;background:#fff;user-select:text;cursor:text;">' +
        'Correct Answer: (' + correctOptionNum + ')</span>';

      var answerRow = document.createElement('tr');
      answerRow.style.backgroundColor = '#ffffff';
      answerRow.appendChild(answerTd);

      if (insertAfter) {
        tbody.insertBefore(answerRow, insertAfter);
      } else {
        tbody.appendChild(answerRow);
      }
      // next insertion goes after answerRow
      insertAfter = answerRow.nextSibling;
    }

    // ── 7. Insert Hindi version box ─────────────────────────
    // Only add if we have at least one valid image src to convert
    var hasImages = questionImgSrc || optionImgSrcs.some(function(s){ return s; });
    if (!hasImages) return;

    // Build inner HTML for Hindi box
    // Header label
    var hindiHTML =
      '<div style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;' +
      'color:#000;padding:6px 10px 4px;border-bottom:1px solid #bbb;' +
      'background:#f0f0f0;letter-spacing:0.3px;">🇮🇳 Hindi Version</div>';

    // Question image (Hindi)
    if (questionImgSrc) {
      var hiQSrc = toHindi(questionImgSrc);
      hindiHTML +=
        '<div style="padding:8px 10px 4px;">' +
          '<img src="' + hiQSrc + '" style="max-width:100%;display:block;" ' +
          'onerror="this.style.display=\'none\'" />' +
        '</div>';
    }

    // Option images (Hindi) with numbering
    optionImgSrcs.forEach(function(src, idx) {
      if (!src) return;
      var hiSrc = toHindi(src);
      var num   = idx + 1;
      var isCorrect = (num === correctOptionNum);

      // label for this option
      var label = '<span style="font-size:13px;font-weight:900;color:#000;font-family:Arial;min-width:18px;display:inline-block;">' + num + '</span>';
      if (isCorrect) {
        label += '<span style="font-size:10px;font-weight:800;color:#000;font-family:Arial;margin-left:3px;">Correct ✔</span>';
      }

      hindiHTML +=
        '<div style="display:flex;align-items:flex-start;padding:3px 10px;gap:8px;">' +
          '<div style="min-width:40px;text-align:center;padding-top:4px;">' + label + '</div>' +
          '<div><img src="' + hiSrc + '" style="max-width:95%;display:block;" ' +
          'onerror="this.style.display=\'none\'" /></div>' +
        '</div>';
    });

    // Wrap everything in a bordered box
    var hindiTd = document.createElement('td');
    hindiTd.setAttribute('colspan', '10');
    hindiTd.style.padding = '0';
    hindiTd.innerHTML =
      '<div style="border:2px solid #000;border-radius:6px;overflow:hidden;' +
      'margin:6px 14px 4px;background:#fff;">' + hindiHTML + '</div>';

    var hindiRow = document.createElement('tr');
    hindiRow.style.backgroundColor = '#ffffff';
    hindiRow.appendChild(hindiTd);

    if (insertAfter) {
      tbody.insertBefore(hindiRow, insertAfter);
    } else {
      tbody.appendChild(hindiRow);
    }
  });

  // ── 8. Unblock Ctrl+P and open print dialog ───────────────
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'p') {
      e.stopImmediatePropagation();
    }
  }, true);

  document.oncontextmenu = null;

  var printStyle = document.createElement('style');
  printStyle.textContent =
    '@media print{' +
      '.watermark-container,.watermark-text,' +
      '.challenge-btn,a[style*="007BFF"],' +
      '.language-switch{display:none!important}' +
      'body{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '}';
  document.head.appendChild(printStyle);

  console.log('✅ Done! All options numbered, correct/wrong labelled, Hindi versions added.');
  console.log('📄 Opening print/save PDF dialog in 1 second...');

  setTimeout(function() { window.print(); }, 1000);

})();
