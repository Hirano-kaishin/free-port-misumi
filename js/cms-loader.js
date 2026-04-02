// ====================================================
// FREE PORT CMS Loader
// 各ページで読み込み、localStorageまたはGASからデータを取得してページに反映
// ====================================================

(function() {
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbyiMUV8EKyEl6aM_2BukHy2VVQ4CbedYla0ZksXwKhvG6Ilzq4WMs1yASEPHjl4aFxN/exec';

  // ページ名を自動判定
  var path = location.pathname.split('/').pop().replace('.html', '') || 'index';
  var pageName = path;

  var pageMap = {
    'camp': 'camp',
    'coffee': 'coffee',
    'gear': 'gear',
    'goods': 'goods',
    'furniture': 'furniture',
    'about': 'about',
    'access': 'access'
  };

  if (!pageMap[pageName]) return;

  function loadData() {
    // 1. localStorageから読み込み
    var local = localStorage.getItem('fp_cms_' + pageName);
    if (local) {
      try {
        var data = JSON.parse(local);
        applyData(data);
        return;
      } catch(e) {}
    }

    // 2. GASから読み込み
    fetch(GAS_URL + '?action=getPageData&page=' + pageName)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.sections && data.sections.length > 0) {
          applyData(data);
        }
      })
      .catch(function() {});
  }

  function applyData(data) {
    if (data.sections) {
      data.sections.forEach(function(sec) { applySection(sec); });
    }
    if (data.plans && data.plans.length > 0) {
      applyPlans(data.plans);
    }
    if (data.options && data.options.length > 0) {
      applyOptions(data.options);
    }
    if (data.images && data.images.length > 0) {
      applyImages(data.images);
    }
  }

  // ====== セクション適用 ======
  function applySection(sec) {
    var key = sec.section_key;
    if (!key) return;

    var els = document.querySelectorAll('[data-cms-section="' + key + '"]');
    els.forEach(function(el) {
      var field = el.dataset.cmsField;
      if (!field) return;

      // フィールド名のマッピング: body1→body, body2→body2, etc.
      var value = sec[field];

      // bodyN のフォールバック: body1 → body
      if ((value === undefined || value === null || value === '') && field === 'body1') {
        value = sec['body'];
      }

      if (value === undefined || value === null || value === '') return;

      // 改行をbrに変換
      value = String(value).replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

      if (el.tagName === 'IMG') {
        el.src = value;
      } else {
        el.innerHTML = value;
      }
    });
  }

  // ====== プラン適用 ======
  function applyPlans(plans) {
    plans.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    plans.forEach(function(plan) {
      var key = plan.plan_key;
      if (!key) return;

      var els = document.querySelectorAll('[data-cms-plan="' + key + '"]');
      els.forEach(function(el) {
        var field = el.dataset.cmsField;
        if (!field) return;

        var value;
        // plan fieldsのマッピング
        if (field === 'label_ja') value = plan.name_ja;
        else if (field === 'label_en') value = plan.name_en;
        else value = plan[field];

        if (value === undefined || value === null || value === '') return;

        value = String(value).replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

        if (field === 'tags') {
          var tags = value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
          el.innerHTML = tags.map(function(t) {
            return '<span style="font-size:13px;color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.1);padding:6px 14px">' + t + '</span>';
          }).join('');
        } else {
          el.innerHTML = value;
        }
      });
    });
  }

  // ====== オプション適用 ======
  function applyOptions(options) {
    options.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

    var groups = {};
    options.forEach(function(opt) {
      var gk = opt.group_key;
      if (!groups[gk]) groups[gk] = { name_en: opt.group_name_en, name_ja: opt.group_name_ja, items: [] };
      groups[gk].items.push(opt);
    });

    for (var gk in groups) {
      var container = document.querySelector('[data-cms-options="' + gk + '"]');
      if (!container) continue;

      var tbody = container.querySelector('tbody');
      if (!tbody) continue;

      tbody.innerHTML = '';
      groups[gk].items.forEach(function(item) {
        var tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        tr.innerHTML = '<td style="padding:14px 0">' + escHtml(item.item_name) + '</td>' +
          '<td style="text-align:right;padding:14px 0;font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:#faf9f6;letter-spacing:0.04em">' + escHtml(item.price) + '</td>';
        tbody.appendChild(tr);
      });
    }
  }

  // ====== 画像適用 ======
  function applyImages(images) {
    images.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    images.forEach(function(img) {
      // idで検索
      var els = document.querySelectorAll('[data-cms-image="' + img.id + '"]');

      els.forEach(function(el) {
        if (img.image_url) {
          // img-fillの中にimgタグがある場合
          var innerImg = el.querySelector('img');
          if (innerImg) {
            innerImg.src = img.image_url;
          } else {
            el.style.backgroundImage = 'url("' + img.image_url + '")';
          }
        }
        if (img.position) {
          el.style.backgroundPosition = img.position;
        }
      });
    });
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
  } else {
    loadData();
  }
})();
