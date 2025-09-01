// Main data store
let companies = [];
let selectedCompanyId = null;
let tasks = [];
let currentTaskFilter = 'all'; // 'all', 'active', 'completed'

// Initialize the app
function init() {
    console.log("App initializing...");
    
    // Load data from localStorage
    loadCompanies();
    loadTasks();
    
    // Render initial UI
    renderCompanyList();
    renderTasksList();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show data file reminder if not recently dismissed
    if (!localStorage.getItem('reminderDismissed')) {
        setTimeout(checkForLocalDataFile, 2000);
    }
    
    console.log("Initialization complete");
}

// Load companies from localStorage
function loadCompanies() {
    const storedCompanies = localStorage.getItem('customerManagementCompanies');
    if (storedCompanies) {
        companies = JSON.parse(storedCompanies);
    } else {
        // Initialize with sample data
        companies = [
            {
                id: 1,
                name: "Acme Inc.",
                contact: "John Doe",
                email: "john@acme.com",
                portalUrl: "https://portal.acme.com",
                websiteUrl: "https://acme.com",
                country: "USA",
                psa: "Connectwise",
                plan: "Premium",
                firstOnboarding: "2024-04-15",
                secondOnboarding: "2024-04-22",
                coverPage: true,
                widgets: true,
                hardwareTemplate: false,
                mspTemplate: true,
                notes: [
                    { id: 1, content: "Initial meeting went well. They're interested in the full suite.", date: "2024-04-10T14:30:00Z" },
                    { id: 2, content: "Sent follow-up email with pricing details.", date: "2024-04-12T09:15:00Z" },
                    { id: 3, content: "Scheduled first onboarding session.", date: "2024-04-13T11:45:00Z" }
                ]
            },
            {
                id: 2,
                name: "TechStart LLC",
                contact: "Jane Smith",
                email: "jane@techstart.io",
                portalUrl: "https://portal.techstart.io",
                websiteUrl: "https://techstart.io",
                country: "New Zealand",
                psa: "Autotask",
                plan: "Standard",
                firstOnboarding: "2024-04-18",
                secondOnboarding: "",
                coverPage: false,
                widgets: false,
                hardwareTemplate: true,
                mspTemplate: false,
                notes: [
                    { id: 1, content: "They're mainly interested in hardware solutions.", date: "2024-04-14T13:20:00Z" },
                    { id: 2, content: "Need to follow up about potential plan upgrade.", date: "2024-04-16T10:30:00Z" }
                ]
            }
        ];
        saveCompanies();
    }
}

// Load tasks from localStorage
function loadTasks() {
    const storedTasks = localStorage.getItem('customerManagementTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    } else {
        // Initialize with sample tasks
        tasks = [
            {
                id: 1,
                description: "Follow up with Acme Inc. about additional widget requirements",
                companyId: 1,
                completed: false,
                date: "2024-04-20T10:30:00Z"
            },
            {
                id: 2,
                description: "Prepare hardware template for TechStart LLC",
                companyId: 2,
                completed: false,
                date: "2024-04-21T09:15:00Z"
            },
            {
                id: 3,
                description: "Research new PSA integrations",
                companyId: null, // General task not tied to a company
                completed: true,
                date: "2024-04-15T14:45:00Z"
            }
        ];
        saveTasks();
    }
}

// Save companies to localStorage
function saveCompanies() {
    localStorage.setItem('customerManagementCompanies', JSON.stringify(companies));
    console.log("Companies saved to localStorage:", companies);
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('customerManagementTasks', JSON.stringify(tasks));
    console.log("Tasks saved to localStorage:", tasks);
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderCompanyList(e.target.value);
        });
        console.log("Search input listener attached");
    } else {
        console.error("Search input element not found");
    }
    
    // Create company buttons - primary button in the header
    const createCompanyBtn = document.getElementById('create-company-btn');
    if (createCompanyBtn) {
        createCompanyBtn.addEventListener('click', function() {
            console.log("Create company button clicked");
            showAddCompanyForm();
        });
        console.log("Create company button listener attached");
    } else {
        console.error("Create company button not found");
    }
    
    // Secondary create company button in the empty state
    const createCompanyBtnAlt = document.querySelector('.create-company-btn');
    if (createCompanyBtnAlt) {
        createCompanyBtnAlt.addEventListener('click', function() {
            console.log("Alternative create company button clicked");
            showAddCompanyForm();
        });
        console.log("Alternative create company button listener attached");
    }
    
    // Add company form
    attachListener('close-add-form', 'click', hideAddCompanyForm);
    attachListener('cancel-add-company', 'click', hideAddCompanyForm);
    attachListener('save-new-company', 'click', saveNewCompany);
    
    // Edit company
    attachListener('edit-company-button', 'click', showEditCompanyForm);
    attachListener('cancel-edit-company', 'click', hideEditCompanyForm);
    attachListener('save-company-changes', 'click', saveCompanyChanges);
    
    // Delete company
    attachListener('delete-company-button', 'click', confirmDeleteCompany);
    
    // Notes - FIXED: Direct onclick handler for add note button
    const addNoteBtn = document.getElementById('add-note-button');
    if (addNoteBtn) {
        addNoteBtn.onclick = function() {
            console.log("Add note button clicked via direct handler");
            addNote();
            return false;
        };
        console.log("Add note button direct handler attached");
    } else {
        console.error("Add note button not found");
    }
    
    // Create task from note
    const addTaskFromNoteBtn = document.getElementById('add-task-from-note');
    if (addTaskFromNoteBtn) {
        addTaskFromNoteBtn.onclick = function() {
            console.log("Add task from note button clicked");
            
            // Get note content
            const noteContent = document.getElementById('new-note-content').value.trim();
            if (noteContent) {
                // Pre-fill task form with note content
                showAddTaskForm();
                document.getElementById('new-task-description').value = noteContent;
                
                // If a company is selected, pre-select it in the task form
                if (selectedCompanyId) {
                    document.getElementById('new-task-company').value = selectedCompanyId;
                }
            } else {
                showNotification("Please enter some text in the note field first", "warning");
            }
            
            return false;
        };
    }
    
    // Tasks
    attachListener('add-task-button', 'click', showAddTaskForm);
    attachListener('cancel-add-task', 'click', hideAddTaskForm);
    attachListener('save-new-task', 'click', saveNewTask);
    
    // Task filters
    attachListener('filter-all-tasks', 'click', function() { filterTasks('all'); });
    attachListener('filter-active-tasks', 'click', function() { filterTasks('active'); });
    attachListener('filter-completed-tasks', 'click', function() { filterTasks('completed'); });
    
    // Data Options button
    const dataOptionsBtn = document.getElementById('data-options-btn');
    if (dataOptionsBtn) {
        dataOptionsBtn.onclick = function(e) {
            e.preventDefault();
            const dropdown = document.getElementById('data-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('show');
                console.log("Data dropdown toggled directly");
            }
            return false;
        };
        console.log("Data options button direct onclick handler attached");
    }
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(event) {
        if (!event.target.matches('#data-options-btn') && !event.target.closest('#data-options-btn')) {
            const dropdown = document.getElementById('data-dropdown');
            if (dropdown && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    });
    
    // Export/Import data - FIXED: Direct handlers
    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        exportDataBtn.onclick = function(e) {
            e.preventDefault();
            exportData(false); // Regular export with date in filename
            return false;
        };
    }
    
    const saveToFileBtn = document.getElementById('save-to-file');
    if (saveToFileBtn) {
        saveToFileBtn.onclick = function(e) {
            e.preventDefault();
            exportData(true); // Export with fixed filename for easier reloading
            showNotification('Saved to customer-data.json. Store this file in the app folder for safekeeping.');
            return false;
        };
    }
    
    const importDataBtn = document.getElementById('import-data');
    if (importDataBtn) {
        importDataBtn.onclick = function(e) {
            e.preventDefault();
            const importFile = document.getElementById('import-file');
            if (importFile) {
                importFile.click();
            }
            return false;
        };
    }
    
    const importFile = document.getElementById('import-file');
    if (importFile) {
        importFile.addEventListener('change', importData);
    }
    
    console.log("Event listeners setup complete");
}

// Toggle data dropdown visibility - Global function for direct HTML calls
window.toggleDataDropdown = function() {
    console.log("Global toggleDataDropdown called");
    const dropdown = document.getElementById('data-dropdown');
    if (dropdown) {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            dropdown.classList.add('show');
        }
        console.log("Dropdown toggled:", dropdown.classList.contains('show'));
    } else {
        console.error("Data dropdown not found by global function");
    }
    return false; // Prevent default
};

// Helper function to safely attach event listeners
function attachListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
        console.log(`Listener attached to ${elementId}`);
    } else {
        console.error(`Element ${elementId} not found`);
    }
}

// Show the add company form
function showAddCompanyForm() {
    console.log("Showing add company form");
    hideAllMainContentViews();
    document.getElementById('add-company-form').classList.remove('hidden');
}

// Hide the add company form
function hideAddCompanyForm() {
    console.log("Hiding add company form");
    document.getElementById('add-company-form').classList.add('hidden');
    
    if (selectedCompanyId) {
        showCompanyDetails();
    } else {
        showNoSelectionView();
    }
    
    // Reset the form
    document.getElementById('new-company-name').value = '';
    document.getElementById('new-company-contact').value = '';
    document.getElementById('new-company-email').value = '';
    document.getElementById('new-company-portal').value = '';
    document.getElementById('new-company-website').value = '';
    document.getElementById('new-company-country').value = 'USA';
    document.getElementById('new-company-psa').value = 'Autotask';
    document.getElementById('new-company-plan').value = 'Standard';
    document.getElementById('new-company-first-onboarding').value = '';
    document.getElementById('new-company-second-onboarding').value = '';
    document.getElementById('new-company-cover-page').checked = false;
    document.getElementById('new-company-widgets').checked = false;
    document.getElementById('new-company-hardware').checked = false;
    document.getElementById('new-company-msp').checked = false;
}

// Show the add task form
function showAddTaskForm() {
    console.log("Showing add task form");
    document.getElementById('add-task-form').classList.remove('hidden');
    
    // Populate company dropdown
    const companySelect = document.getElementById('new-task-company');
    companySelect.innerHTML = '<option value="">None (General Task)</option>';
    
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        companySelect.appendChild(option);
    });
    
    // Pre-select current company if one is selected
    if (selectedCompanyId) {
        companySelect.value = selectedCompanyId;
    }
}

// Hide the add task form
function hideAddTaskForm() {
    console.log("Hiding add task form");
    document.getElementById('add-task-form').classList.add('hidden');
    
    // Reset the form
    document.getElementById('new-task-description').value = '';
    document.getElementById('new-task-company').value = '';
}

// Save a new company
function saveNewCompany() {
    const newCompany = {
        id: Date.now(), // Generate a unique ID based on timestamp
        name: document.getElementById('new-company-name').value,
        contact: document.getElementById('new-company-contact').value,
        email: document.getElementById('new-company-email').value,
        portalUrl: document.getElementById('new-company-portal').value,
        websiteUrl: document.getElementById('new-company-website').value,
        country: document.getElementById('new-company-country').value,
        psa: document.getElementById('new-company-psa').value,
        plan: document.getElementById('new-company-plan').value,
        firstOnboarding: document.getElementById('new-company-first-onboarding').value,
        secondOnboarding: document.getElementById('new-company-second-onboarding').value,
        coverPage: document.getElementById('new-company-cover-page').checked,
        widgets: document.getElementById('new-company-widgets').checked,
        hardwareTemplate: document.getElementById('new-company-hardware').checked,
        mspTemplate: document.getElementById('new-company-msp').checked,
        notes: []
    };
    
    // Validate required fields
    if (!newCompany.name) {
        alert('Company name is required');
        return;
    }
    
    // Add to companies array
    companies.push(newCompany);
    saveCompanies();
    
    // Update the UI
    renderCompanyList();
    selectCompany(newCompany.id);
    hideAddCompanyForm();
    
    showNotification(`Company "${newCompany.name}" added successfully`);
}

// Save a new task
function saveNewTask() {
    const description = document.getElementById('new-task-description').value.trim();
    const companyId = document.getElementById('new-task-company').value;
    
    // Validate required fields
    if (!description) {
        showNotification('Task description is required', 'warning');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        description: description,
        companyId: companyId ? parseInt(companyId) : null,
        completed: false,
        date: new Date().toISOString()
    };
    
    // Add to tasks array
    tasks.push(newTask);
    saveTasks();
    
    // Update the UI
    renderTasksList();
    hideAddTaskForm();
    
    showNotification('Task added successfully');
}

// Show the edit company form
function showEditCompanyForm() {
    const company = getSelectedCompany();
    if (!company) return;
    
    document.getElementById('company-info-display').classList.add('hidden');
    document.getElementById('edit-company-form').classList.remove('hidden');
    
    // Fill the form with company data
    document.getElementById('edit-company-name').value = company.name;
    document.getElementById('edit-company-contact').value = company.contact;
    document.getElementById('edit-company-email').value = company.email;
    document.getElementById('edit-company-portal').value = company.portalUrl;
    document.getElementById('edit-company-website').value = company.websiteUrl;
    document.getElementById('edit-company-country').value = company.country || 'USA';
    document.getElementById('edit-company-psa').value = company.psa || 'Autotask';
    document.getElementById('edit-company-plan').value = company.plan;
    document.getElementById('edit-company-first-onboarding').value = company.firstOnboarding;
    document.getElementById('edit-company-second-onboarding').value = company.secondOnboarding;
    document.getElementById('edit-company-cover-page').checked = company.coverPage;
    document.getElementById('edit-company-widgets').checked = company.widgets;
    document.getElementById('edit-company-hardware').checked = company.hardwareTemplate;
    document.getElementById('edit-company-msp').checked = company.mspTemplate;
}

// Hide the edit company form
function hideEditCompanyForm() {
    document.getElementById('edit-company-form').classList.add('hidden');
    document.getElementById('company-info-display').classList.remove('hidden');
}

// Save company changes
function saveCompanyChanges() {
    const company = getSelectedCompany();
    if (!company) return;
    
    // Update company data
    company.name = document.getElementById('edit-company-name').value;
    company.contact = document.getElementById('edit-company-contact').value;
    company.email = document.getElementById('edit-company-email').value;
    company.portalUrl = document.getElementById('edit-company-portal').value;
    company.websiteUrl = document.getElementById('edit-company-website').value;
    company.country = document.getElementById('edit-company-country').value;
    company.psa = document.getElementById('edit-company-psa').value;
    company.plan = document.getElementById('edit-company-plan').value;
    company.firstOnboarding = document.getElementById('edit-company-first-onboarding').value;
    company.secondOnboarding = document.getElementById('edit-company-second-onboarding').value;
    company.coverPage = document.getElementById('edit-company-cover-page').checked;
    company.widgets = document.getElementById('edit-company-widgets').checked;
    company.hardwareTemplate = document.getElementById('edit-company-hardware').checked;
    company.mspTemplate = document.getElementById('edit-company-msp').checked;
    
    // Validate required fields
    if (!company.name) {
        alert('Company name is required');
        return;
    }
    
    // Save and update UI
    saveCompanies();
    renderCompanyList();
    updateCompanyDetails(company);
    hideEditCompanyForm();
    
    // Update any tasks associated with this company (to reflect name changes)
    renderTasksList();
    
    showNotification(`Company "${company.name}" updated successfully`);
}

// Confirm delete company
function confirmDeleteCompany() {
    const company = getSelectedCompany();
    if (!company) return;
    
    if (confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
        deleteCompany(company.id);
    }
}

// Delete a company
function deleteCompany(companyId) {
    // Find the company index
    const companyIndex = companies.findIndex(company => company.id === companyId);
    
    if (companyIndex === -1) return;
    
    // Get company name before deletion
    const companyName = companies[companyIndex].name;
    
    // Remove the company
    companies.splice(companyIndex, 1);
    saveCompanies();
    
    // Update UI
    selectedCompanyId = null;
    renderCompanyList();
    showNoSelectionView();
    
    // Update tasks - set companyId to null for tasks associated with this company
    let tasksUpdated = false;
    tasks.forEach(task => {
        if (task.companyId === companyId) {
            task.companyId = null;
            tasksUpdated = true;
        }
    });
    
    if (tasksUpdated) {
        saveTasks();
        renderTasksList();
    }
    
    showNotification(`Company "${companyName}" deleted successfully`);
}

// Add a note to the selected company
function addNote() {
    console.log("Add note function called");
    
    const noteContent = document.getElementById('new-note-content').value.trim();
    if (!noteContent) {
        console.log("Note content is empty, not adding");
        return;
    }
    
    const company = getSelectedCompany();
    if (!company) {
        console.log("No company selected, cannot add note");
        return;
    }
    
    // Check if notes array exists and create if not
    if (!company.notes) {
        company.notes = [];
    }
    
    const note = {
        id: Date.now(),
        content: noteContent,
        date: new Date().toISOString()
    };
    
    console.log("Adding note to company:", note);
    
    // Add to the company's notes
    company.notes.unshift(note); // Add at the beginning
    saveCompanies();
    
    // Update UI
    renderNotes(company);
    
    // Clear the textarea
    document.getElementById('new-note-content').value = '';
    
    // Show confirmation
    showNotification("Note added successfully");
}

// Delete a note
function deleteNote(noteId) {
    const company = getSelectedCompany();
    if (!company) return;
    
    // Find and remove the note
    company.notes = company.notes.filter(note => note.id !== noteId);
    saveCompanies();
    
    // Update UI
    renderNotes(company);
}

// Toggle task completion
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // Toggle the completed status
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();
    
    // Update UI
    renderTasksList();
    
    const actionText = tasks[taskIndex].completed ? "completed" : "marked as incomplete";
    showNotification(`Task ${actionText}`);
}

// Delete a task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        // Remove the task
        tasks.splice(taskIndex, 1);
        saveTasks();
        
        // Update UI
        renderTasksList();
        
        showNotification('Task deleted successfully');
    }
}

// Filter tasks based on status
function filterTasks(filter) {
    currentTaskFilter = filter;
    
    // Get filter buttons
    const allTasksBtn = document.getElementById('filter-all-tasks');
    const activeTasksBtn = document.getElementById('filter-active-tasks');
    const completedTasksBtn = document.getElementById('filter-completed-tasks');
    
    // Reset all buttons to default style
    if (allTasksBtn) {
        allTasksBtn.className = 'px-3 py-1 bg-white text-gray-700 rounded-l-lg text-sm';
    }
    
    if (activeTasksBtn) {
        activeTasksBtn.className = 'px-3 py-1 bg-white text-gray-700 text-sm border-t border-b';
    }
    
    if (completedTasksBtn) {
        completedTasksBtn.className = 'px-3 py-1 bg-white text-gray-700 rounded-r-lg text-sm';
    }
    
    // Apply active style to selected filter
    if (filter === 'all' && allTasksBtn) {
        allTasksBtn.className = 'px-3 py-1 bg-blue-500 text-white rounded-l-lg text-sm';
    } else if (filter === 'active' && activeTasksBtn) {
        activeTasksBtn.className = 'px-3 py-1 bg-blue-500 text-white text-sm border-t border-b';
    } else if (filter === 'completed' && completedTasksBtn) {
        completedTasksBtn.className = 'px-3 py-1 bg-blue-500 text-white rounded-r-lg text-sm';
    }
    
    // Render tasks with filter applied
    renderTasksList();
}

// Render the company list
function renderCompanyList(searchTerm = '') {
    const companyList = document.getElementById('company-list');
    const noCompaniesElement = document.getElementById('no-companies');
    
    // Clear the list
    companyList.innerHTML = '';
    
    // Filter companies based on search term
    const filteredCompanies = companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Show appropriate message if no companies
    if (filteredCompanies.length === 0) {
        companyList.classList.add('hidden');
        noCompaniesElement.classList.remove('hidden');
    } else {
        companyList.classList.remove('hidden');
        noCompaniesElement.classList.add('hidden');
        
        // Create list items
        filteredCompanies.forEach(company => {
            const li = document.createElement('li');
            li.className = `company-list-item ${company.id === selectedCompanyId ? 'selected' : ''}`;
            li.innerHTML = `
                <div class="font-medium">${company.name}</div>
                <div class="text-sm text-gray-600">${company.contact}</div>
            `;
            li.addEventListener('click', () => selectCompany(company.id));
            companyList.appendChild(li);
        });
    }
}

// Render tasks list
function renderTasksList() {
    const tasksList = document.getElementById('tasks-list');
    
    // Clear the list
    tasksList.innerHTML = '';
    
    // Filter tasks based on current filter
    let filteredTasks = [...tasks];
    
    if (currentTaskFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentTaskFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // Sort tasks: active first, then by date (newest first)
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Active tasks first
        }
        return new Date(b.date) - new Date(a.date); // Newest first
    });
    
    // Show appropriate message if no tasks
    if (filteredTasks.length === 0) {
        const noTasksMessage = document.createElement('div');
        noTasksMessage.id = 'no-tasks';
        noTasksMessage.className = 'text-center text-gray-500 py-6';
        noTasksMessage.textContent = 'No tasks yet';
        tasksList.appendChild(noTasksMessage);
    } else {
        // Create task elements
        filteredTasks.forEach(task => {
            // Find associated company if any
            const company = task.companyId ? companies.find(c => c.id === task.companyId) : null;
            
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            // Format date
            const taskDate = new Date(task.date);
            const formattedDate = taskDate.toLocaleString();
            
            // Determine company class for styling
            let companyClass = 'none';
            if (company) {
                if (company.plan === 'Premium') {
                    companyClass = 'premium';
                } else if (company.plan === 'Advanced') {
                    companyClass = 'advanced';
                } else if (company.plan === 'Standard') {
                    companyClass = 'standard';
                }
            }
            
            taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
                <div class="task-content">
                    <div class="task-description">${task.description}</div>
                    ${company ? 
                        `<div class="task-company ${companyClass}" data-company-id="${company.id}">${company.name}</div>` : 
                        `<div class="task-company none">General</div>`
                    }
                    <div class="task-date">${formattedDate}</div>
                </div>
                <div class="task-actions">
                    <button class="text-red-500 hover:text-red-700 delete-task" data-task-id="${task.id}">
                        <i data-feather="trash" class="h-4 w-4"></i>
                    </button>
                </div>
            `;
            
            tasksList.appendChild(taskElement);
        });
        
        // Update Feather icons
        feather.replace();
        
        // Add event listeners to checkboxes and delete buttons
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-task-id'));
                toggleTaskCompletion(taskId);
            });
        });
        
        document.querySelectorAll('.delete-task').forEach(button => {
            button.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-task-id'));
                deleteTask(taskId);
            });
        });
        
        // Add event listeners to company tags to navigate to that company
        document.querySelectorAll('.task-company[data-company-id]').forEach(tag => {
            tag.addEventListener('click', function() {
                const companyId = parseInt(this.getAttribute('data-company-id'));
                selectCompany(companyId);
            });
        });
    }
}

// Select a company
function selectCompany(companyId) {
    selectedCompanyId = companyId;
    
    // Update UI
    renderCompanyList(document.getElementById('search-input').value);
    
    const company = getSelectedCompany();
    if (company) {
        showCompanyDetails();
        updateCompanyDetails(company);
        renderNotes(company);
    }
}

// Get the selected company
function getSelectedCompany() {
    return companies.find(company => company.id === selectedCompanyId);
}

// Show company details view
function showCompanyDetails() {
    hideAllMainContentViews();
    document.getElementById('company-details').classList.remove('hidden');
}

// Show no selection view
function showNoSelectionView() {
    hideAllMainContentViews();
    document.getElementById('no-selection').classList.remove('hidden');
}

// Hide all main content views
function hideAllMainContentViews() {
    document.getElementById('no-selection').classList.add('hidden');
    document.getElementById('add-company-form').classList.add('hidden');
    document.getElementById('company-details').classList.add('hidden');
}

// Update company details in the UI
function updateCompanyDetails(company) {
    document.getElementById('company-name-title').textContent = company.name;
    document.getElementById('company-contact').textContent = company.contact;
    
    const emailElement = document.getElementById('company-email');
    emailElement.textContent = company.email;
    emailElement.href = `mailto:${company.email}`;
    
    const portalElement = document.getElementById('company-portal');
    portalElement.textContent = company.portalUrl;
    portalElement.href = company.portalUrl;
    
    const websiteElement = document.getElementById('company-website');
    websiteElement.textContent = company.websiteUrl;
    websiteElement.href = company.websiteUrl;
    
    // Country field
    document.getElementById('company-country').textContent = company.country || 'Not specified';
    
    // PSA field
    document.getElementById('company-psa').textContent = company.psa || 'Not specified';
    
    // Plan badge
    const planElement = document.getElementById('company-plan');
    planElement.textContent = company.plan;
    planElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (company.plan === 'Premium') {
        planElement.classList.add('plan-premium');
    } else if (company.plan === 'Advanced') {
        planElement.classList.add('plan-advanced');
    } else {
        planElement.classList.add('plan-standard');
    }
    
    // Onboarding dates
    document.getElementById('company-first-onboarding').textContent = 
        company.firstOnboarding ? new Date(company.firstOnboarding).toLocaleDateString() : 'Not scheduled';
    document.getElementById('company-second-onboarding').textContent = 
        company.secondOnboarding ? new Date(company.secondOnboarding).toLocaleDateString() : 'Not scheduled';
    
    // Feature checkboxes
    document.getElementById('company-cover-page').className = 
        `h-4 w-4 rounded ${company.coverPage ? 'checkbox-active' : 'checkbox-inactive'}`;
    document.getElementById('company-widgets').className = 
        `h-4 w-4 rounded ${company.widgets ? 'checkbox-active' : 'checkbox-inactive'}`;
    document.getElementById('company-hardware').className = 
        `h-4 w-4 rounded ${company.hardwareTemplate ? 'checkbox-active' : 'checkbox-inactive'}`;
    document.getElementById('company-msp').className = 
        `h-4 w-4 rounded ${company.mspTemplate ? 'checkbox-active' : 'checkbox-inactive'}`;
}

// Render notes for a company
function renderNotes(company) {
    console.log("Rendering notes for company:", company.name);
    
    const notesList = document.getElementById('notes-list');
    if (!notesList) {
        console.error("Notes list element not found!");
        return;
    }
    
    // Clear the list
    notesList.innerHTML = '';
    
    // Make sure company has notes array
    if (!company.notes) {
        company.notes = [];
    }
    
    console.log("Company has", company.notes.length, "notes");
    
    // Create no notes message element
    const noNotesMessage = document.createElement('div');
    noNotesMessage.id = 'no-notes';
    noNotesMessage.className = 'text-center text-gray-500 py-6';
    noNotesMessage.textContent = 'No notes yet';
    
    // Show appropriate message if no notes
    if (company.notes.length === 0) {
        notesList.appendChild(noNotesMessage);
    } else {
        // Create note elements
        company.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'bg-white p-4 rounded-lg shadow';
            
            // Format date
            const noteDate = new Date(note.date);
            const formattedDate = noteDate.toLocaleString();
            
            noteElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="note-timestamp">${formattedDate}</div>
                    <button class="text-red-500 hover:text-red-700 delete-note" data-note-id="${note.id}">
                        <i data-feather="trash" class="h-4 w-4"></i>
                    </button>
                </div>
                <div class="mt-2 note-content">${note.content}</div>
            `;
            
            notesList.appendChild(noteElement);
        });
        
        // Update Feather icons
        feather.replace();
        
        // Add delete event listeners
        document.querySelectorAll('.delete-note').forEach(button => {
            button.addEventListener('click', function() {
                const noteId = parseInt(this.getAttribute('data-note-id'));
                deleteNote(noteId);
            });
        });
    }
}

// Export data to a JSON file
function exportData(useDefaultFilename = false) {
    // Create a data object with a timestamp
    const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        companies: companies,
        tasks: tasks
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    
    // Use a consistent filename for the data file if requested
    if (useDefaultFilename) {
        a.download = 'customer-data.json';
    } else {
        a.download = `customer-data-${new Date().toISOString().slice(0, 10)}.json`;
    }
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    // Hide dropdown
    const dropdown = document.getElementById('data-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    
    // Show save confirmation
    const lastSavedTime = new Date().toLocaleTimeString();
    showNotification(`Data exported successfully at ${lastSavedTime}`);
    
    // Update last saved info
    updateLastSavedInfo();
}

// Import data from a JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate the imported data
            if (!importedData.companies || !Array.isArray(importedData.companies)) {
                throw new Error('Invalid data format');
            }
            
            // Confirm before overwriting
            if (confirm(`This will import ${importedData.companies.length} companies and ${importedData.tasks?.length || 0} tasks and replace your current data. Continue?`)) {
                companies = importedData.companies;
                
                // Import tasks if available
                if (importedData.tasks && Array.isArray(importedData.tasks)) {
                    tasks = importedData.tasks;
                }
                
                saveCompanies();
                saveTasks();
                renderCompanyList();
                renderTasksList();
                
                // If there were companies, select the first one
                if (companies.length > 0) {
                    selectCompany(companies[0].id);
                } else {
                    selectedCompanyId = null;
                    showNoSelectionView();
                }
                
                showNotification('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.readAsText(file);
    
    // Hide dropdown
    const dropdown = document.getElementById('data-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

// Add notification system
function showNotification(message, type = 'info', duration = 3000) {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'fixed bottom-4 right-4 z-50';
        document.body.appendChild(notificationContainer);
    }
    
    // Determine notification color based on type
    let bgColor = 'bg-blue-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'success') bgColor = 'bg-green-500';
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg mb-2 flex items-center justify-between`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="ml-2 text-white hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    // Add close button functionality
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => {
        notificationContainer.removeChild(notification);
    });
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notificationContainer.removeChild(notification);
        }
    }, duration);
}

// Update last saved information
function updateLastSavedInfo() {
    const lastSaved = document.getElementById('last-saved-info');
    if (lastSaved) {
        lastSaved.textContent = `Last saved: ${new Date().toLocaleString()}`;
        lastSaved.classList.remove('hidden');
    }
}

// Check for local data file
function checkForLocalDataFile() {
    // Show a reminder about saving data
    const reminder = `
        <div class="p-4 mb-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium">Data Storage Reminder</h3>
                    <div class="mt-2 text-sm">
                        <p>For secure data storage, regularly save your data to a file by clicking "Save Data to File" in the Data Options menu. Store this file in the same folder as the application.</p>
                    </div>
                    <div class="mt-2">
                        <button id="dismiss-reminder" class="text-sm text-blue-600 hover:text-blue-500">Dismiss</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add reminder to page
    const reminderContainer = document.createElement('div');
    reminderContainer.id = 'storage-reminder';
    reminderContainer.className = 'fixed bottom-4 left-4 max-w-md z-40';
    reminderContainer.innerHTML = reminder;
    document.body.appendChild(reminderContainer);
    
    // Add dismiss button functionality
    document.getElementById('dismiss-reminder').addEventListener('click', function() {
        document.body.removeChild(reminderContainer);
        localStorage.setItem('reminderDismissed', 'true');
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
