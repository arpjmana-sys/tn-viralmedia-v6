document.addEventListener("DOMContentLoaded", () => {

const newsContainer = document.getElementById("newsContainer");

const news = [

{
title: "TN ViralMedia v6 Started Successfully",
description: "Welcome to the new generation Tamil News Website."
},

{
title: "Breaking News",
description: "Latest Tamil Nadu, India and World News will appear here."
},

{
title: "Technology",
description: "AI, Mobile, Internet and Technology updates."
}

];

news.forEach(item => {

const card = document.createElement("div");

card.style.background = "#ffffff";
card.style.padding = "20px";
card.style.margin = "20px 0";
card.style.borderRadius = "8px";
card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";

card.innerHTML = `
<h2>${item.title}</h2>
<p>${item.description}</p>
`;

newsContainer.appendChild(card);

});

});
