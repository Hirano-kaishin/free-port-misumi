// ====================================================
// FREE PORT CMS Loader
// 各ページで読み込み、Firestore からデータを取得してページに反映
// ====================================================

import { loadPageData as firestoreLoad, loadImageBlob } from './firebase.js?v=20260411f';

(function() {
  // ページ名を自動判定
  var path = location.pathname.split('/').pop().replace('.html', '') || 'index';
  var pageName = path;

  var pageMap = {
    'camp': 'camp',
    'coffee': 'coffee',
    'gear': 'gear',
    'goods': 'goods',
    'furniture': 'furniture',
    'works': 'works',
    'about': 'about',
    'access': 'access'
  };

  if (!pageMap[pageName]) return;

  function loadData() {
    // Firestoreから読み込み（唯一のデータソース）
    firestoreLoad(pageName).then(function(fsData) {
      if (fsData) {
        applyData(fsData);
      }
    }).catch(function(err) {
      console.error('Firestore接続エラー:', err);
    });
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
    // fsimg: 参照の base64 実データを先に解決
    var pending = [];
    images.forEach(function(img) {
      if (img && typeof img.image_url === 'string' && img.image_url.indexOf('fsimg:') === 0) {
        var key = img.image_url.substring(6);
        pending.push(loadImageBlob(key).then(function(data) {
          img.image_url = data || '';
        }).catch(function() { img.image_url = ''; }));
      }
    });
    Promise.all(pending).then(function() { renderImages(images); });
  }

  function renderImages(images) {
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
            if (img.alt) innerImg.alt = img.alt;
          } else if (el.tagName === 'IMG') {
            el.src = img.image_url;
            if (img.alt) el.alt = img.alt;
          } else {
            el.style.backgroundImage = 'url("' + img.image_url + '")';
          }
        }
        if (img.position) {
          el.style.backgroundPosition = img.position;
        }
      });
    });

    // 動的ギャラリー: data-cms-gallery="section_key" を持つコンテナに
    // section_key が一致する画像を並べる。さらに、どの data-cms-image にも
    // section_key が一致するギャラリーにも属さない「孤児」画像は、
    // 最初のギャラリーコンテナに自動で追加される（section_key を気にせず追加可能）
    var galleries = document.querySelectorAll('[data-cms-gallery]');
    if (galleries.length > 0) {
      var matchedImageIds = {};
      document.querySelectorAll('[data-cms-image]').forEach(function(el) {
        matchedImageIds[el.getAttribute('data-cms-image')] = true;
      });
      var galleryKeys = {};
      var defaultGalleryKey = null;
      galleries.forEach(function(c) {
        var k = c.getAttribute('data-cms-gallery');
        galleryKeys[k] = c;
        if (!defaultGalleryKey) defaultGalleryKey = k;
      });

      var buckets = {};
      Object.keys(galleryKeys).forEach(function(k) { buckets[k] = []; });

      images.forEach(function(img) {
        if (!img.image_url) return;
        if (galleryKeys[img.section_key]) {
          buckets[img.section_key].push(img);
        } else if (!matchedImageIds[img.id]) {
          // どこにも属さない画像はデフォルトギャラリーに追加
          buckets[defaultGalleryKey].push(img);
        }
      });

      Object.keys(buckets).forEach(function(k) {
        var matched = buckets[k].sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
        if (matched.length === 0) return;
        var container = galleryKeys[k];
        container.innerHTML = '';
        matched.forEach(function(img) {
          var fig = document.createElement('figure');
          fig.style.margin = '0';
          fig.style.display = 'flex';
          fig.style.flexDirection = 'column';
          var el = document.createElement('img');
          el.src = img.image_url;
          el.alt = img.alt || '';
          fig.appendChild(el);
          var cap = document.createElement('figcaption');
          cap.textContent = img.alt || '';
          cap.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.6);text-align:center;margin-top:6px;line-height:1.4;font-weight:300;min-height:1em';
          fig.appendChild(cap);
          container.appendChild(fig);
        });
      });
    }
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
