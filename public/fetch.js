document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const dropdownList = document.getElementById('dropdownList');

    // Debounce function used to prevent a lot of fetch request per input.
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    // Function to handle the debounced input event
    const handleDebouncedInput = async function () {
        const searchTerm = searchInput.value.trim();
        console.log("Search Term: ", searchTerm);

        try {
            const { bookTitle, bookAuthor, coverId } = await fetchData(searchTerm);            
            
            console.log("Searched Book: ", bookTitle);
            console.log("Cover Id: ", coverId);
            console.log("Book Author: ", bookAuthor);
            // Update the dropdown list
            await updateDropdown(bookTitle, coverId, bookAuthor, dropdownList);
        } catch (error) {
            console.error('Error updating dropdown:', error);
        }
    };

    // Attach the debounced input event handler
    searchInput.addEventListener('input', debounce(handleDebouncedInput, 300));

    document.addEventListener('click', function (event) {
        // Close dropdown when clicking outside the search container
        if (!event.target.closest('.dropdown')) {
            dropdownList.style.display = 'none';
        }
    });
    // Star rating label click logic (vanilla JS)
    const labels = document.querySelectorAll(".rating-stars label");
    labels.forEach(label => {
        label.addEventListener("click", function() {
            labels.forEach(l => l.classList.remove("checked"));
            const labelValue = parseInt(this.getAttribute("for").replace(/[^0-9]/g, ""));
            for (let i = 0; i < labelValue; i++) {
                if (labels[i]) labels[i].classList.add("checked");
            }
        });
    });
    
});

async function fetchData(searchTerm) {
    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${searchTerm}&limit=10`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        const result = data.docs;
        const bookTitle = result.map((book) => book.title);
        const bookAuthor = result.map((book) => book.author_name ? book.author_name[0] : 'Unknown');
        const coverId = result.map((book) => book.cover_i);        

        return {
            bookTitle: bookTitle,
            bookAuthor: bookAuthor,
            coverId: coverId,
        };
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, function(tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

function updateDropdown(items, coverId, bookAuthor, dropdownList) {
    // Create valid dropdown structure: ul > li > a
    const html = `<ul class="dropdown-list-ul">` + items.map((item, index) =>
        `<li class="listItem">
            <a href="/book?title=${encodeURIComponent(item)}&author=${encodeURIComponent(bookAuthor[index])}&cover_id=${coverId[index] ? coverId[index] : 0}">
                <img src="https://covers.openlibrary.org/b/id/${coverId[index]}-S.jpg?default=https://openlibrary.org/static/images/icons/avatar_book-sm.png" width="40" height="60" alt="book picture">
                <div>
                    <p><strong>${escapeHTML(item)}</strong></p>
                    <p>By ${escapeHTML(bookAuthor[index])}</p>
                </div>
            </a>
        </li>`).join('') + `</ul>`;
    dropdownList.innerHTML = html;

    // Show/hide dropdown
    if (items.length > 0) {
        dropdownList.style.display = 'block';
    } else {
        dropdownList.style.display = 'none';
    }
}