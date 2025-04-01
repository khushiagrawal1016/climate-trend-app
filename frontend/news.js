document.addEventListener("DOMContentLoaded", function() {
    // Fetch news on page load
    fetchNews();
  
    function fetchNews() {
      fetch('/api/news')
        .then(response => response.json())
        .then(data => {
          console.log("News data:", data);
          renderNews(data);
        })
        .catch(error => {
          console.error("Error fetching news:", error);
        });
    }
  
    function renderNews(data) {
      const newsContainer = document.getElementById("newsContainer");
      newsContainer.innerHTML = ""; // Clear any existing content
  
      // Check if articles exist
      if (!data.articles || data.articles.length === 0) {
        newsContainer.innerHTML = "<p>No news available at the moment.</p>";
        return;
      }
  
      // Loop over articles and create HTML elements for each
      data.articles.forEach(article => {
        // Create a container for each article
        const articleDiv = document.createElement("div");
        articleDiv.classList.add("news-article");
  
        // Create a headline element that links to the full article
        const headline = document.createElement("h3");
        const headlineLink = document.createElement("a");
        headlineLink.href = article.url;
        headlineLink.target = "_blank";
        headlineLink.textContent = article.title;
        headline.appendChild(headlineLink);
        
        // Create a paragraph for description
        const description = document.createElement("p");
        description.textContent = article.description || "";
        
        // Create a published date element
        const pubDate = document.createElement("p");
        pubDate.classList.add("pub-date");
        pubDate.textContent = `Published on: ${new Date(article.publishedAt).toLocaleDateString()}`;
  
        // Append headline, description, and date to the article container
        articleDiv.appendChild(headline);
        articleDiv.appendChild(description);
        articleDiv.appendChild(pubDate);
  
        // Append the article container to the news container
        newsContainer.appendChild(articleDiv);
      });
    }
  });
  