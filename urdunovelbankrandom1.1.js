


// === Random Posts Widget Logic (FINAL FIXED) ===

// 1. Fetch Total Posts
async function fetchTotalPosts(label) {
  const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(label)}?alt=json`);
  const data = await res.json();
  return data.feed.openSearch$totalResults.$t;
}

// 2. Fetch Posts
async function fetchPosts(label, total) {
  const maxResults = Math.min(total, 50);
  const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(label)}?alt=json&max-results=${maxResults}`);
  const data = await res.json();
  let posts = data.feed.entry || [];
  posts = posts.filter(entry => !entry.app$control); // Remove drafts
  return posts;
}

// 3. Random Indexes
function getRandomIndexes(total, count) {
  const indexes = new Set();
  while (indexes.size < count && indexes.size < total) {
    indexes.add(Math.floor(Math.random() * total));
  }
  return [...indexes];
}

// 4. Create Post Item
function createPostItem(entry, config) {
  const title = entry.title.$t;

  // Link Handling
  let linkObj = entry.link.find(l => l.rel === "alternate") || entry.link.find(l => l.rel === "self");
  let link = linkObj ? linkObj.href : "#";
  if (link.startsWith("http://")) link = link.replace("http://", "https://");
  link = link.split("#")[0];

  const date = new Date(entry.published.$t);
  
  // --- YE LINE MISSING THI, ADD KAR DI HAI ---
  const comments = entry.thr$total ? entry.thr$total.$t + " Comments" : "Comments Disabled";
  
  // === ✅ MAIN IMAGE FIX ===
  let thumb = config.noThumb;
  
  if (entry.media$thumbnail && entry.media$thumbnail.url) {
    thumb = entry.media$thumbnail.url;

    // 1. YouTube High Quality Fix
    if (thumb.includes("youtube.com") || thumb.includes("ytimg.com")) {
        thumb = thumb.replace(/\/default\.jpg|\/mqdefault\.jpg|\/hqdefault\.jpg|\/sddefault\.jpg/, "/maxresdefault.jpg");
    } 
    // 2. Blogger Image Fix (Handles w640-h426, s72-c, s1600, etc.)
    else {
        thumb = thumb.replace(/\/(s|w|h)\d+[^/]*\//, "/s1600/");
    }
  }
// === ✅ OPTIMIZED IMAGE FIX (Fast + Clear) ===
    // let thumb = config.noThumb;

    // if (entry.media$thumbnail && entry.media$thumbnail.url) {
    //     thumb = entry.media$thumbnail.url;

    //     // 1. YouTube: Use mqdefault (Medium Quality is enough for small thumbs)
    //     // If you want HD, use hqdefault. maxresdefault is too heavy.
    //     if (thumb.includes("youtube.com") || thumb.includes("ytimg.com")) {
    //         thumb = thumb.replace(/\/default\.jpg|\/mqdefault\.jpg|\/hqdefault\.jpg|\/sddefault\.jpg/, "/hqdefault.jpg");
    //     } 
    //     // 2. Blogger Images: Use w400-h400-c (Perfect for widgets)
    //     else {
    //         // Replaces any size (s72-c, w640-h426, s1600) with w400-h400-c
    //         // w400-h400-c = Width 400, Height 400, Crop (Square)
    //         thumb = thumb.replace(/\/(s|w|h)\d+[^/]*\//, "/w400-h400-c/");
    //     }
    // }
    // ============================================
  let content = entry.summary?.$t || entry.content?.$t || "";
  content = content.replace(/<[^>]*>/g, "");
  if (content.length > config.chars) {
    content = content.substring(0, config.chars).trim() + "…";
  }

  const li = document.createElement("li");
  li.innerHTML = `
    <a href="${link}" title="${title}">
      <img src="${config.noThumb}" data-src="${thumb}" alt="Thumbnail of ${title}" loading="lazy" class="lazy-thumb">
    </a>
    <div>
      <a href="${link}" title="${title}">${title}</a>
      ${config.details ? `<div class="random-info">${date.toLocaleDateString()} - ${comments}</div>` : ""}
      <div class="random-summary">${content}</div>
    </div>
  `;
  return li;
}

// 5. Lazy Load (With Safety Fallback)
function lazyLoadImages() {
  const images = document.querySelectorAll("img.lazy-thumb");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        // Fallback: Agar s1600 fail ho to w600 try kare
        img.onerror = function() {
            this.onerror = null;
            this.src = this.src.replace("/s1600/", "/w600/"); 
        };
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: "50px" });
  images.forEach(img => observer.observe(img));
}

// 6. Loader
async function loadRandomPosts(config) {
  const container = document.getElementById(config.containerId);
  container.innerHTML = "";
  try {
    const total = await fetchTotalPosts(config.label);
    if (total === 0) {
      container.innerHTML = `<li>No posts found for label: ${config.label}</li>`;
      return;
    }
    const posts = await fetchPosts(config.label, total);
    const indexes = getRandomIndexes(posts.length, config.number);
    for (const idx of indexes) {
      const entry = posts[idx];
      if (entry) container.appendChild(createPostItem(entry, config));
    }
    lazyLoadImages();
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML = "<li>Failed to load.</li>";
  }
}














// // === Random Posts Widget ===

// // Total posts count
// async function fetchTotalPosts(label) {
//   const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(label)}?alt=json`);
//   const data = await res.json();
//   return data.feed.openSearch$totalResults.$t;
// }

// // Fetch posts (filter drafts)
// async function fetchPosts(label, total) {
//   const maxResults = Math.min(total, 50); // Max 50
//   const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(label)}?alt=json&max-results=${maxResults}`);
//   const data = await res.json();
//   let posts = data.feed.entry || [];

//   // ✅ Remove drafts
//   posts = posts.filter(entry => !entry.app$control);

//   return posts;
// }

// // Random index selection
// function getRandomIndexes(total, count) {
//   const indexes = new Set();
//   while (indexes.size < count && indexes.size < total) {
//     indexes.add(Math.floor(Math.random() * total));
//   }
//   return [...indexes];
// }

// // Create one post item
// function createPostItem(entry, config) {
//   const title = entry.title.$t;

//   // ✅ Get correct post link
//   let linkObj = entry.link.find(l => l.rel === "alternate") || entry.link.find(l => l.rel === "self");
//   let link = linkObj ? linkObj.href : "#";

//   // Force https
// // Clean Blogger feed link
// if (link.startsWith("http://")) {
//   link = link.replace("http://", "https://");
// }
// link = link.split("#")[0]; // remove #gsc.tab=0 etc.

  

//   const date = new Date(entry.published.$t);
//   const comments = entry.thr$total ? entry.thr$total.$t + " Comments" : "Comments Disabled";
//   const thumb = entry.media$thumbnail?.url?.replace(/s\d+-c/, "s1600") || config.noThumb;

//   let content = entry.summary?.$t || entry.content?.$t || "";
//   content = content.replace(/<[^>]*>/g, "");
//   if (content.length > config.chars) {
//     content = content.substring(0, config.chars).trim();
//     const lastSpace = content.lastIndexOf(" ");
//     if (lastSpace !== -1) {
//       content = content.substring(0, lastSpace) + "…";
//     } else {
//       content = content.substring(0, config.chars) + "…";
//     }
//   }

//   const li = document.createElement("li");
//   li.innerHTML = `
//     <a href="${link}" title="${title}">
//       <img src="${config.noThumb}" data-src="${thumb}" alt="Thumbnail of ${title}" loading="lazy" class="lazy-thumb">
//     </a>
//     <div>
//       <a href="${link}" title="${title}">${title}</a>
//       ${config.details ? `<div class="random-info">${date.toLocaleDateString()} - ${comments}</div>` : ""}
//       <div class="random-summary">${content}</div>
//     </div>
//   `;
//   return li;
// }

// // Lazy loading thumbnails
// function lazyLoadImages() {
//   const images = document.querySelectorAll("img.lazy-thumb");
//   const observer = new IntersectionObserver(entries => {
//     entries.forEach(entry => {
//       if (entry.isIntersecting) {
//         const img = entry.target;
//         img.src = img.dataset.src;
//         observer.unobserve(img);
//       }
//     });
//   }, { rootMargin: "50px" });

//   images.forEach(img => observer.observe(img));
// }

// // Load posts into one widget
// async function loadRandomPosts(config) {
//   const container = document.getElementById(config.containerId);
//   container.innerHTML = "";
//   try {
//     const total = await fetchTotalPosts(config.label);
//     if (total === 0) {
//       container.innerHTML = `<li>No posts found for label: ${config.label}</li>`;
//       return;
//     }
//     const posts = await fetchPosts(config.label, total);
//     const indexes = getRandomIndexes(posts.length, config.number);
//     for (const idx of indexes) {
//       const entry = posts[idx];
//       if (entry) container.appendChild(createPostItem(entry, config));
//     }
//     lazyLoadImages();
//   } catch (error) {
//     console.error("Error loading random posts:", error);
//     container.innerHTML = "<li>Failed to load posts. Please try again later.</li>";
//   }
// }

