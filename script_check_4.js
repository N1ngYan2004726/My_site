

// Listing 年份分组：将 Quarto listing 文章按年份分组，并在侧边栏添加年份导航

(function() {

  'use strict';



  function groupListingByYear() {

    var listing = document.querySelector('.quarto-listing');

    if (!listing) return;



    var posts = listing.querySelectorAll('.quarto-post');

    if (posts.length === 0) return;



    // 收集每个文章的年份

    var yearGroups = {};

    var postArray = Array.prototype.slice.call(posts);



    postArray.forEach(function(post) {

      var dateEl = post.querySelector('.listing-date, .date');

      var dateText = dateEl ? dateEl.textContent.trim() : '';

      var year = '';



      // 尝试从日期文本中提取年份

      var match = dateText.match(/(\d{4})/);

      if (match) {

        year = match[1];

      } else {

        // 尝试从 metadata 属性中获取

        var meta = post.querySelector('.metadata');

        if (meta) {

          var metaMatch = meta.textContent.match(/(\d{4})/);

          if (metaMatch) year = metaMatch[1];

        }

      }



      if (!year) year = '其他';



      if (!yearGroups[year]) {

        yearGroups[year] = [];

      }

      yearGroups[year].push(post);

    });



    // 按年份降序排序

    var sortedYears = Object.keys(yearGroups).sort(function(a, b) {

      return parseInt(b) - parseInt(a);

    });



    if (sortedYears.length <= 1 && sortedYears[0] === '其他') return;



    // 创建年份分组

    var listingContainer = posts[0].parentElement;



    sortedYears.forEach(function(year) {

      var yearHeader = document.createElement('h2');

      yearHeader.className = 'listing-year-header';

      yearHeader.id = 'year-' + year;

      yearHeader.textContent = year;

      yearHeader.style.cssText = 'font-size:1.4rem;font-weight:600;color:var(--text);margin-top:2rem;margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:2px solid var(--accent-soft);';



      // 在该年份的第一个文章前插入标题

      var firstPost = yearGroups[year][0];

      listingContainer.insertBefore(yearHeader, firstPost);



      // 为该年份的所有文章添加 data-year 属性

      yearGroups[year].forEach(function(post) {

        post.setAttribute('data-year', year);

      });

    });



    // 在侧边栏添加年份导航

    var sidebar = document.querySelector('#quarto-margin-sidebar, .margin-sidebar');

    if (sidebar) {

      var yearNav = document.createElement('nav');

      yearNav.className = 'listing-year-nav';

      yearNav.innerHTML = '<h3 class="listing-year-title" style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:0.4rem;margin-bottom:0.6rem;">Years</h3>';



      var yearList = document.createElement('ul');

      yearList.style.cssText = 'list-style:none;padding-left:0;';



      sortedYears.forEach(function(year) {

        var li = document.createElement('li');

        var a = document.createElement('a');

        a.href = '#year-' + year;

        a.textContent = year;

        a.style.cssText = 'color:var(--muted);text-decoration:none;font-size:0.85rem;display:block;padding:0.2rem 0.5rem;border-radius:4px;transition:all 0.2s ease;';

        a.addEventListener('mouseenter', function() {

          a.style.color = 'var(--accent)';

          a.style.background = 'var(--accent-soft)';

        });

        a.addEventListener('mouseleave', function() {

          a.style.color = 'var(--muted)';

          a.style.background = 'transparent';

        });

        li.appendChild(a);

        yearList.appendChild(li);

      });



      yearNav.appendChild(yearList);



      // 插入到侧边栏顶部（在分类筛选之前）

      var firstChild = sidebar.firstElementChild;

      if (firstChild) {

        sidebar.insertBefore(yearNav, firstChild);

      } else {

        sidebar.appendChild(yearNav);

      }

    }

  }



  // 等待 Quarto listing 渲染完成后执行

  function init() {

    // 立即尝试

    if (document.querySelector('.quarto-post')) {

      groupListingByYear();

      return;

    }



    // 使用 MutationObserver 等待 listing 渲染

    var observer = new MutationObserver(function(mutations, obs) {

      if (document.querySelector('.quarto-post')) {

        groupListingByYear();

        obs.disconnect();

      }

    });



    observer.observe(document.body, {

      childList: true,

      subtree: true

    });



    // 超时后停止观察

    setTimeout(function() {

      observer.disconnect();

      if (document.querySelector('.quarto-post') && !document.querySelector('.listing-year-header')) {

        groupListingByYear();

      }

    }, 5000);

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', init);

  } else {

    init();

  }

})();

