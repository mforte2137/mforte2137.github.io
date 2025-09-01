// Main data store
let companies = [];
let selectedCompanyId = null;
let tasks = [];
let currentTaskFilter = 'all'; // 'all', 'active', 'completed'
let currentStatusFilter = 'all'; // 'all', 'onboarding', 'active', 'pre-sales', 'churned'

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
        
        // Add status field to existing companies if they don't have it
        companies.forEach(company => {
            if (!company.status) {
                company.status = 'active'; // Default to active for existing companies
            }
        });
        
        console.log("Loaded companies from storage:", companies);
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
                status: "active",
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
                status: "onboarding",
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
    console.log("Companies saved to localStorage");
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('customerManagementTasks', JSON.stringify(tasks));
    console.log("Tasks saved to localStorage");
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
    
    // Status filter buttons
    attachListener('filter-all-companies', 'click', function() { filterCompaniesByStatus('all'); });
    attachListener('filter-onboarding', 'click', function() { filterCompaniesByStatus('onboarding'); });
    attachListener('filter-active', 'click', function() { filterCompaniesByStatus('active'); });
    attachListener('filter-pre-sales', 'click', function() { filterCompaniesByStatus('pre-sales'); });
    attachListener('filter-churned', 'click', function() { filterCompaniesByStatus('churned'); });
    
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
    
    // Notes - Add and cancel edit buttons
    const addNoteBtn = document.getElementById('add-note-button');
    if (addNoteBtn) {
        addNoteBtn.onclick = function() {
            console.log("Add/Update note button clicked");
            addNote();
            return false;
        };
        console.log("Add note button direct handler attached");
    } else {
        console.error("Add note button not found");
    }
    
    // Cancel note edit button
    const cancelEditNoteBtn = document.getElementById('cancel-edit-note');
    if (cancelEditNoteBtn) {
        cancelEditNoteBtn.onclick = function() {
            console.log("Cancel edit note button clicked");
            cancelNoteEdit();
            return false;
        };
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
    
    // Export/Import data - Direct handlers
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

// Filter companies by status
function filterCompaniesByStatus(status) {
    currentStatusFilter = status;
    console.log("Filtering companies by status:", status);
    
    // Update filter button styles
    const filterButtons = [
        { id: 'filter-all-companies', status: 'all' },
        { id: 'filter-onboarding', status: 'onboarding' },
        { id: 'filter-active', status: 'active' },
        { id: 'filter-pre-sales', status: 'pre-sales' },
        { id: 'filter-churned', status: 'churned' }
    ];
    
    filterButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            if (button.status === status) {
                element.className = 'status-filter-btn active';
            } else {
                element.className = 'status-filter-btn inactive';
            }
        }
    });
    
    // Re-render the company list with filter applied
    const searchTerm = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    renderCompanyList(searchTerm);
}

// Get status badge class and text
function getStatusInfo(status) {
    const statusMap = {
        'onboarding': { class: 'status-onboarding', text: 'Onboarding' },
        'active': { class: 'status-active', text: 'Active' },
        'pre-sales': { class: 'status-pre-sales', text: 'Pre-Sales' },
        'churned': { class: 'status-churned', text: 'Churned' }
    };
    
    return statusMap[status] || { class: 'status-active', text: 'Active' };
}

// Helper function to safely attach event listeners
function attachListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
        console.log(`Listener attached to ${elementId}`);
    } else {
        console.log(`Element ${elementId} not found (may not exist yet)`);
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
    document.getElementById('new-company-status').value = 'pre-sales';
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
        status: document.getElementById('new-company-status').value,
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
    document.getElementById('edit-company-status').value = company.status || 'active';
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
    company.status = document.getElementById('edit-company-status').value;
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
    
    // Update any tasks associated with this company
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
    
    // Check if we're editing an existing note
    const editingNoteId = document.getElementById('new-note-content').getAttribute('data-editing-note-id');
    
    if (editingNoteId) {
        // We're editing an existing note
        const noteId = parseInt(editingNoteId);
        const noteIndex = company.notes.findIndex(note => note.id === noteId);
        
        if (noteIndex !== -1) {
            // Update the note content
            company.notes[noteIndex].content = noteContent;
            company.notes[noteIndex].edited = true;
            company.notes[noteIndex].editDate = new Date().toISOString();
            
            // Save the changes
            saveCompanies();
            
            // Update UI
            renderNotes(company);
            
            // Reset note editing state
            document.getElementById('new-note-content').value = '';
            document.getElementById('new-note-content').removeAttribute('data-editing-note-id');
            document.getElementById('add-note-button').textContent = 'Add Note';
            document.getElementById('cancel-edit-note').classList.add('hidden');
            
            // Show confirmation
            showNotification("Note updated successfully");
        }
    } else {
        // We're adding a new note
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
}

// Edit a note
function editNote(noteId) {
    const company = getSelectedCompany();
    if (!company) return;
    
    // Find the note
    const note = company.notes.find(note => note.id === noteId);
    if (!note) return;
    
    // Fill the textarea with the note content
    const noteTextarea = document.getElementById('new-note-content');
    noteTextarea.value = note.content;
    noteTextarea.setAttribute('data-editing-note-id', noteId);
    noteTextarea.focus();
    
    // Change the button text
    document.getElementById('add-note-button').textContent = 'Update Note';
    
    // Show the cancel edit button
    document.getElementById('cancel-edit-note').classList.remove('hidden');
    
    // Scroll to the textarea
    noteTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Cancel note editing
function cancelNoteEdit() {
    // Clear the textarea
    document.getElementById('new-note-content').value = '';
    document.getElementById('new-note-content').removeAttribute('data-editing-note-id');
    
    // Reset the button text
    document.getElementById('add-note-button').textContent = 'Add Note';
    
    // Hide the cancel edit button
    document.getElementById('cancel-edit-note').classList.add('hidden');
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
    
    // If we were editing this note, cancel the edit
    const editingNoteId = document.getElementById('new-note-content').getAttribute('data-editing-note-id');
    if (editingNoteId && parseInt(editingNoteId) === noteId) {
        cancelNoteEdit();
    }
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
    
    // Filter companies based on search term and status
    let filteredCompanies = companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply status filter if not "all"
    if (currentStatusFilter !== 'all') {
        filteredCompanies = filteredCompanies.filter(company => 
            company.status === currentStatusFilter
        );
    }
    
    console.log(`Rendering ${filteredCompanies.length} companies (filter: ${currentStatusFilter})`);
    
    // Show appropriate message if no companies
    if (filteredCompanies.length === 0) {
        companyList.classList.add('hidden');
        noCompaniesElement.classList.remove('hidden');
        if (currentStatusFilter !== 'all') {
            noCompaniesElement.textContent = `No ${currentStatusFilter} companies found`;
        } else {
            noCompaniesElement.textContent = 'No companies found';
        }
    } else {
        companyList.classList.remove('hidden');
        noCompaniesElement.classList.add('hidden');
        
        // Create list items
        filteredCompanies.forEach(company => {
            const statusInfo = getStatusInfo(company.status || 'active');
            
            const li = document.createElement('li');
            li.className = `company-list-item ${company.id === selectedCompanyId ? 'selected' : ''}`;
            li.innerHTML = `
                <div class="company-item-content">
                    <div class="company-item-main">
                        <div class="company-item-name">${company.name}</div>
                        <div class="company-item-contact">${company.contact}</div>
                    </div>
                    <div class="company-item-status">
                        <span class="status-badge ${statusInfo.class}">
                            ${statusInfo.text}
                        </span>
                    </div>
                </div>
            `;
            
            li.addEventListener('click', () => {
                console.log(`Clicked on company: ${company.name} (ID: ${company.id})`);
                selectCompany(company.id);
            });
            
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
            
            // Determine company class for styling based on status
            let companyClass = 'none';
            if (company) {
                if (company.status === 'active' && company.plan === 'Premium') {
                    companyClass = 'premium';
                } else if (company.status === 'active' && company.plan === 'Advanced') {
                    companyClass = 'advanced';
                } else if (company.status === 'active' && company.plan === 'Standard') {
                    companyClass = 'standard';
                } else if (company.status === 'onboarding') {
                    companyClass = 'advanced'; // Yellow-ish for onboarding
                } else if (company.status === 'pre-sales') {
                    companyClass = 'standard'; // Blue-ish for pre-sales
                } else if (company.status === 'churned') {
                    companyClass = 'none'; // Gray for churned
                }
            }
            
            taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
                <div class="task-content">
                    <div class="task-description">${task.description}</div>
                    ${company ? 
                        `<div class="task-company ${companyClass}" data-company-id="${company.id}">${company.name} (${getStatusInfo(company.status).text})</div>` : 
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
            
            // Create edited indicator if the note has been edited
            let editedInfo = '';
            if (note.edited) {
                const editDate = new Date(note.editDate);
                const formattedEditDate = editDate.toLocaleString();
                editedInfo = `<span class="text-xs text-gray-500 ml-2">(Edited: ${formattedEditDate})</span>`;
            }
            
            noteElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="note-timestamp">
                        ${formattedDate}
                        ${editedInfo}
                    </div>
                    <div class="flex">
                        <button class="text-blue-500 hover:text-blue-700 edit-note mr-2" data-note-id="${note.id}">
                            <i data-feather="edit-2" class="h-4 w-4"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700 delete-note" data-note-id="${note.id}">
                            <i data-feather="trash" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2 note-content">${note.content}</div>
            `;
            
            notesList.appendChild(noteElement);
        });
        
        // Update Feather icons
        feather.replace();
        
        // Add edit event listeners
        document.querySelectorAll('.edit-note').forEach(button => {
            button.addEventListener('click', function() {
                const noteId = parseInt(this.getAttribute('data-note-id'));
                editNote(noteId);
            });
        });
        
        // Add delete event listeners
        document.querySelectorAll('.delete-note').forEach(button => {
            button.addEventListener('click', function() {
                const noteId = parseInt(this.getAttribute('data-note-id'));
                deleteNote(noteId);
            });
        });
    }
}

// CRITICAL FIX: Select a company - This was the main bug!
function selectCompany(companyId) {
    console.log("=== SELECTING COMPANY ===");
    console.log("Company ID:", companyId);
    
    selectedCompanyId = companyId;
    
    // Update UI - re-render the company list to show selection
    const searchTerm = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    renderCompanyList(searchTerm);
    
    // Get the selected company and verify it exists
    const company = getSelectedCompany();
    if (company) {
        console.log("SUCCESS: Found selected company:", company.name);
        console.log("Company data:", company);
        showCompanyDetails();
        updateCompanyDetails(company);
        renderNotes(company);
    } else {
        console.error("ERROR: Could not find company with ID:", companyId);
        console.log("Available companies:", companies.map(c => ({ id: c.id, name: c.name })));
    }
    console.log("=== END SELECT COMPANY ===");
}

// CRITICAL FIX: Get the selected company - Added better error checking
function getSelectedCompany() {
    if (!selectedCompanyId) {
        console.log("No company selected");
        return null;
    }
    
    console.log("Looking for company with ID:", selectedCompanyId);
    console.log("Available companies:", companies.map(c => ({ id: c.id, name: c.name })));
    
    const company = companies.find(company => company.id === selectedCompanyId);
    if (!company) {
        console.error("Selected company ID", selectedCompanyId, "not found in companies array");
    } else {
        console.log("Found company:", company.name);
    }
    
    return company;
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

// CRITICAL FIX: Update company details - This displays the correct data
function updateCompanyDetails(company) {
    console.log("=== UPDATING COMPANY DETAILS ===");
    console.log("Updating details for company:", company.name);
    
    // Update company name in title
    const titleElement = document.getElementById('company-name-title');
    if (titleElement) {
        titleElement.textContent = company.name;
        console.log("✓ Updated title to:", company.name);
    } else {
        console.error("✗ Title element not found");
    }
    
    // Update contact
    const contactElement = document.getElementById('company-contact');
    if (contactElement) {
        contactElement.textContent = company.contact;
        console.log("✓ Updated contact to:", company.contact);
    } else {
        console.error("✗ Contact element not found");
    }
    
    // Update email
    const emailElement = document.getElementById('company-email');
    if (emailElement) {
        emailElement.textContent = company.email;
        emailElement.href = `mailto:${company.email}`;
        console.log("✓ Updated email to:", company.email);
    } else {
        console.error("✗ Email element not found");
    }
    
    // Update portal URL
    const portalElement = document.getElementById('company-portal');
    if (portalElement) {
        portalElement.textContent = company.portalUrl || 'Not provided';
        portalElement.href = company.portalUrl || '#';
        console.log("✓ Updated portal URL");
    }
    
    // Update website URL
    const websiteElement = document.getElementById('company-website');
    if (websiteElement) {
        websiteElement.textContent = company.websiteUrl || 'Not provided';
        websiteElement.href = company.websiteUrl || '#';
        console.log("✓ Updated website URL");
    }
    
    // Country field
    const countryElement = document.getElementById('company-country');
    if (countryElement) {
        countryElement.textContent = company.country || 'Not specified';
        console.log("✓ Updated country to:", company.country);
    }
    
    // PSA field
    const psaElement = document.getElementById('company-psa');
    if (psaElement) {
        psaElement.textContent = company.psa || 'Not specified';
        console.log("✓ Updated PSA to:", company.psa);
    }
    
    // Status badge
    const statusElement = document.getElementById('company-status');
    if (statusElement) {
        const statusInfo = getStatusInfo(company.status || 'active');
        statusElement.textContent = statusInfo.text;
        statusElement.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`;
        console.log("✓ Updated status to:", statusInfo.text);
    }
    
    // Plan badge
    const planElement = document.getElementById('company-plan');
    if (planElement) {
        planElement.textContent = company.plan;
        planElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
        if (company.plan === 'Premium') {
            planElement.classList.add('plan-premium');
        } else if (company.plan === 'Advanced') {
            planElement.classList.add('plan-advanced');
        } else {
            planElement.classList.add('plan-standard');
        }
        console.log("✓ Updated plan to:", company.plan);
    }
    
    // Onboarding dates
    const firstOnboardingElement = document.getElementById('company-first-onboarding');
    if (firstOnboardingElement) {
        firstOnboardingElement.textContent = 
            company.firstOnboarding ? new Date(company.firstOnboarding).toLocaleDateString() : 'Not scheduled';
    }
    
    const secondOnboardingElement = document.getElementById('company-second-onboarding');
    if (secondOnboardingElement) {
        secondOnboardingElement.textContent = 
            company.secondOnboarding ? new Date(company.secondOnboarding).toLocaleDateString() : 'Not scheduled';
    }
    
    // Feature checkboxes
    const coverPageElement = document.getElementById('company-cover-page');
    if (coverPageElement) {
        coverPageElement.className = 
            `h-4 w-4 rounded ${company.coverPage ? 'checkbox-active' : 'checkbox-inactive'}`;
    }
    
    const widgetsElement = document.getElementById('company-widgets');
    if (widgetsElement) {
        widgetsElement.className = 
            `h-4 w-4 rounded ${company.widgets ? 'checkbox-active' : 'checkbox-inactive'}`;
    }
    
    const hardwareElement = document.getElementById('company-hardware');
    if (hardwareElement) {
        hardwareElement.className = 
            `h-4 w-4 rounded ${company.hardwareTemplate ? 'checkbox-active' : 'checkbox-inactive'}`;
    }
    
    const mspElement = document.getElementById('company-msp');
    if (mspElement) {
        mspElement.className = 
            `h-4 w-4 rounded ${company.mspTemplate ? 'checkbox-active' : 'checkbox-inactive'}`;
    }
    
    console.log("=== COMPANY DETAILS UPDATE COMPLETE ===");
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
                
                // Add status field to imported companies if they don't have it
                companies.forEach(company => {
                    if (!company.status) {
                        company.status = 'active'; // Default to active for imported companies
                    }
                });
                
                // Import tasks if available
                if (importedData.tasks && Array.isArray(importedData.tasks)) {
                    tasks = importedData.tasks;
                }
                
                // Reset selected company since IDs might have changed
                selectedCompanyId = null;
                currentStatusFilter = 'all'; // Reset filter
                
                saveCompanies();
                saveTasks();
                renderCompanyList();
                renderTasksList();
                
                // Reset status filter buttons
                filterCompaniesByStatus('all');
                
                // If there were companies, select the first one
                if (companies.length > 0) {
                    selectCompany(companies[0].id);
                } else {
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
