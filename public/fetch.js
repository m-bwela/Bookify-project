document.addEventListener('DOM is fully loaded', function () {
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
    const label = $("label");
    const labelArray = document.querySelectorAll("label");
    //Add checked (orange color) class clicked labels.    
    label.on("click", function(event) {          
        label.removeClass("checked");        
        const labelValue = $(this).attr("for");
        for (let i = 0; i < labelValue; i++) {            
            $(labelArray[i]).addClass("checked");            
        }       
    })   
    
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

async function updateDropdown(items, coverId, bookAuthor, dropdownList) {
    //create list items based on the fetch results. 
       
    const html = items.map((item, index) =>
        `<a href="/book?title=${item}&author=${bookAuthor[index]}&coverId=${coverId[index]? coverId[index]: 0}">
        <li class="listItem">
        <img src="https://covers.openlibrary.org/b/id/${coverId[index]}-S.jpg?default=https://openlibrary.org/static/images/icons/avatar_book-sm.png" width="40" height="60" alt="book picture">
        <div>
        <p><strong>${item}</strong></p>
        <p>By ${bookAuthor[index]}</p>
        </div>
        </li>
        </a>`).join('');
    dropdownList.innerHTML = html;    

    // Show/hide dropdown
    if (items.length > 0) {
        dropdownList.style.display = 'block';
    } else {
        dropdownList.style.display = 'none';
    }

}