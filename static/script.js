// Budget Buddy Application JavaScript
// Enhanced version with advanced features and analytics

class BudgetBuddy {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.expenseCount = 1;
        this.budgetData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.animateOnScroll();
        this.initializeChart();
        this.loadSavedData();
        this.refreshDashboardIfLoggedIn();
    }

    setupEventListeners() {
        // Navigation toggle for mobile
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });

        // Budget form submission
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateBudget();
            });
        }

        // Real-time validation
        this.setupRealTimeValidation();

        // Add expense button
        const addExpenseBtn = document.getElementById('add-expense');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                this.addExpenseField();
            });
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Reset budget button
        const resetBudgetBtn = document.getElementById('reset-budget');
        if (resetBudgetBtn) {
            resetBudgetBtn.addEventListener('click', () => {
                this.resetBudget();
            });
        }

        // Export data button
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Quick action buttons
        this.setupQuickActions();

        // Hero action buttons
        const startBudgetingBtn = document.querySelector('.hero-actions .btn-primary');
        if (startBudgetingBtn) {
            startBudgetingBtn.addEventListener('click', () => {
                document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
            });
        }

        const learnMoreBtn = document.querySelector('.hero-actions .btn-secondary');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', () => {
                document.querySelector('#features').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Contact action buttons
        const getStartedBtn = document.querySelector('.contact-actions .btn-primary');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
            });
        }

        const scheduleDemoBtn = document.querySelector('.contact-actions .btn-secondary');
        if (scheduleDemoBtn) {
            scheduleDemoBtn.addEventListener('click', () => {
                this.showDemoModal();
            });
        }

        // Nav CTA button
        const navCtaBtn = document.querySelector('.nav-cta');
        if (navCtaBtn) {
            navCtaBtn.addEventListener('click', () => {
                document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    setupRealTimeValidation() {
        const incomeInput = document.getElementById('income');
        const validationDiv = document.getElementById('income-validation');

        if (incomeInput && validationDiv) {
            incomeInput.addEventListener('input', () => {
                const value = parseFloat(incomeInput.value);
                if (value < 0) {
                    validationDiv.textContent = 'Income cannot be negative';
                    validationDiv.className = 'validation-message error';
                } else if (value > 1000000) {
                    validationDiv.textContent = 'Income seems unusually high';
                    validationDiv.className = 'validation-message warning';
                } else if (value > 0) {
                    validationDiv.textContent = '✓ Valid income amount';
                    validationDiv.className = 'validation-message success';
                } else {
                    validationDiv.textContent = '';
                    validationDiv.className = 'validation-message';
                }
            });
        }

        // Auto-save form data
        const formInputs = document.querySelectorAll('#budget-form input, #budget-form select');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.autoSaveForm();
            });
        });
    }

    setupQuickActions() {
        // Export budget
        const exportBtn = document.getElementById('export-budget');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportBudget();
            });
        }

        // Save template
        const saveTemplateBtn = document.getElementById('save-template');
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => {
                this.saveBudgetTemplate();
            });
        }

        // Compare month
        const compareBtn = document.getElementById('compare-month');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.compareWithPreviousMonth();
            });
        }

        // Save advice
        const saveAdviceBtn = document.getElementById('save-advice');
        if (saveAdviceBtn) {
            saveAdviceBtn.addEventListener('click', () => {
                this.saveAdvice();
            });
        }

        // Share advice
        const shareAdviceBtn = document.getElementById('share-advice');
        if (shareAdviceBtn) {
            shareAdviceBtn.addEventListener('click', () => {
                this.shareAdvice();
            });
        }

        // Save to cloud
        const saveCloudBtn = document.getElementById('save-cloud');
        if (saveCloudBtn) {
            saveCloudBtn.addEventListener('click', () => {
                // attach user id when available
                if (this.budgetData && window.BUDGET_BUDDY_USER && window.BUDGET_BUDDY_USER.isAuthenticated) {
                    this.budgetData.user_id = window.BUDGET_BUDDY_USER.id;
                }
                this.saveBudgetToSupabase();
            });
        }
    }

    refreshDashboardIfLoggedIn() {
        // Update UI if authenticated
        fetch('/budget/auth/status/', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (data.authenticated) {
                    window.BUDGET_BUDDY_USER = { isAuthenticated: true, id: data.user.id };
                    this.loadDashboard();
                }
            })
            .catch(() => {});
    }

    loadDashboard() {
        fetch('/budget/dashboard/', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (data.error) return;
                // Inject results into existing widgets
                const incomeEl = document.getElementById('total-income');
                const expensesEl = document.getElementById('total-expenses');
                const savingsEl = document.getElementById('total-savings');
                const savingsRateEl = document.getElementById('savings-rate');
                const progressFill = document.getElementById('progress-fill');
                if (incomeEl && expensesEl && savingsEl && savingsRateEl && progressFill) {
                    const income = data.goal > 0 ? data.total_spent + (data.goal - data.total_spent) : data.total_spent;
                    const savings = Math.max(0, income - data.total_spent);
                    incomeEl.textContent = `${data.currency}${income.toFixed(2)}`;
                    expensesEl.textContent = `${data.currency}${data.total_spent.toFixed(2)}`;
                    savingsEl.textContent = `${data.currency}${savings.toFixed(2)}`;
                    savingsRateEl.textContent = `${data.progress.toFixed(1)}%`;
                    this.updateProgressBar(data.progress);
                }
                // Render expenses list if an element exists
                let list = document.getElementById('expenses-listing');
                if (!list) {
                    const results = document.getElementById('calculator-results');
                    if (results) {
                        list = document.createElement('div');
                        list.id = 'expenses-listing';
                        list.className = 'card';
                        list.style.marginTop = '12px';
                        results.appendChild(list);
                    }
                }
                if (list) {
                    list.innerHTML = '<h4>Recent Expenses</h4>' +
                        data.expenses.map(e => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--gray-200);padding:.5rem 0"><span>${e.description || 'No description'}</span><span>${data.currency}${parseFloat(e.amount).toFixed(2)}</span></div>`).join('');
                }
            })
            .catch(() => {});
    }

    addExpenseField() {
        const expensesList = document.getElementById('expenses-list');
        const newExpense = document.createElement('div');
        newExpense.className = 'expense-item';
        newExpense.innerHTML = `
            <div class="expense-inputs">
                <input type="text" name="expense-name[]" class="form-input expense-name" placeholder="Expense name (e.g., Rent)" required>
                <div class="input-wrapper">
                    <span class="input-prefix">$</span>
                    <input type="number" name="expense-amount[]" class="form-input expense-amount" placeholder="0.00" min="0" step="0.01" required>
                </div>
            </div>
            <div class="expense-category">
                <select name="expense-category[]" class="form-select">
                    <option value="">Select Category</option>
                    <option value="housing">🏠 Housing</option>
                    <option value="transportation">🚗 Transportation</option>
                    <option value="food">🍽️ Food & Dining</option>
                    <option value="utilities">⚡ Utilities</option>
                    <option value="entertainment">🎬 Entertainment</option>
                    <option value="healthcare">🏥 Healthcare</option>
                    <option value="education">📚 Education</option>
                    <option value="other">📦 Other</option>
                </select>
            </div>
            <button type="button" class="btn btn-outline remove-expense" style="margin-top: 8px; width: 100%;">
                <i class="fas fa-trash"></i> Remove
            </button>
        `;

        // Add remove functionality
        const removeBtn = newExpense.querySelector('.remove-expense');
        removeBtn.addEventListener('click', () => {
            newExpense.remove();
            this.autoSaveForm();
        });

        expensesList.appendChild(newExpense);
        this.expenseCount++;

        // Animate the new field
        newExpense.style.opacity = '0';
        newExpense.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            newExpense.style.transition = 'all 0.3s ease';
            newExpense.style.opacity = '1';
            newExpense.style.transform = 'translateY(0)';
        }, 10);

        // Auto-save after adding
        this.autoSaveForm();
    }

    calculateBudget() {
        this.showLoading(true);
        
        // Collect form data
        const formData = this.collectFormData();
        
        // Send to Django backend (ensure CSRF cookie exists first)
        this.ensureCsrfToken().then(() => fetch('/budget/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
            },
            body: JSON.stringify({
                action: 'calculate',
                ...formData
            })
        }))
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                this.showNotification(data.error, 'error');
                return;
            }
            
            // Store budget data
            this.budgetData = {
                income: data.income,
                expenses: formData.expenses,
                totalExpenses: data.total_expenses,
                savings: data.savings,
                savingsRate: data.savings_rate,
                savingsGoal: formData.savings_goal,
                categoryTotals: data.category_breakdown,
                timestamp: new Date()
            };
            
            // Display results
            this.displayResults();
            this.updateProgressBar(data.savings_rate);
            this.updateChart(data.savings_rate);
            this.createExpenseChart(data.category_breakdown);
            
            // Generate and display advice
            document.getElementById('advice-text').textContent = data.advice;
            
            // Show results section
            document.getElementById('calculator-results').style.display = 'block';
            
            // Scroll to results
            document.getElementById('calculator-results').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Save to history
            this.saveToHistory(this.budgetData);
            
            // Show success notification
            this.showNotification('Budget calculated successfully!', 'success');
            
            this.showLoading(false);
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Failed to calculate budget. Please try again.', 'error');
            this.showLoading(false);
        });
    }

    displayResults() {
        if (!this.budgetData) return;

        const { income, totalExpenses, savings, savingsRate, savingsGoal } = this.budgetData;

        document.getElementById('total-income').textContent = `$${income.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('total-savings').textContent = `$${savings.toFixed(2)}`;
        document.getElementById('savings-rate').textContent = `${savingsRate.toFixed(1)}%`;

        // Show/hide goal indicator
        const goalIndicator = document.getElementById('goal-indicator');
        if (savingsGoal > 0) {
            goalIndicator.style.display = 'flex';
            document.getElementById('goal-amount').textContent = `$${savingsGoal.toFixed(2)}`;
            
            // Update goal progress
            const goalProgress = (savings / savingsGoal) * 100;
            if (goalProgress >= 100) {
                goalIndicator.style.background = 'var(--success-color)';
                goalIndicator.innerHTML = '<i class="fas fa-trophy"></i><span>Goal Achieved! 🎉</span>';
            }
        } else {
            goalIndicator.style.display = 'none';
        }

        // Animate the results
        const resultElements = document.querySelectorAll('.summary-value, .progress-percentage');
        resultElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'fadeInUp 0.6s ease-out';
            }, index * 100);
        });
    }

    updateProgressBar(percentage) {
        const progressFill = document.getElementById('progress-fill');
        const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
        
        progressFill.style.width = `${clampedPercentage}%`;
        
        // Add color variation based on percentage
        if (clampedPercentage < 20) {
            progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (clampedPercentage < 50) {
            progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        }
    }

    updateChart(percentage) {
        const chartProgress = document.querySelector('.chart-progress');
        const chartPercentage = document.querySelector('.chart-percentage');
        const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
        
        // Calculate stroke-dashoffset for the circle
        const circumference = 2 * Math.PI * 80; // r = 80
        const offset = circumference - (clampedPercentage / 100) * circumference;
        
        chartProgress.style.strokeDashoffset = offset;
        chartPercentage.textContent = `${clampedPercentage.toFixed(1)}%`;
        
        // Update chart label color based on percentage
        if (clampedPercentage < 20) {
            chartPercentage.style.color = '#ef4444';
        } else if (clampedPercentage < 50) {
            chartPercentage.style.color = '#f59e0b';
        } else {
            chartPercentage.style.color = '#10b981';
        }
    }

    createExpenseChart(categoryTotals) {
        const ctx = document.getElementById('expense-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.expenseChart) {
            this.charts.expenseChart.destroy();
        }

        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        const colors = [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ];

        this.charts.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => this.formatCategoryName(cat)),
                datasets: [{
                    data: amounts,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                cutout: '60%'
            }
        });

        // Update category breakdown
        this.updateCategoryBreakdown(categoryTotals);
    }

    updateCategoryBreakdown(categoryTotals) {
        const breakdownDiv = document.getElementById('category-breakdown');
        if (!breakdownDiv) return;

        const colors = [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ];

        let breakdownHTML = '';
        let colorIndex = 0;

        Object.entries(categoryTotals).forEach(([category, amount]) => {
            breakdownHTML += `
                <div class="category-item">
                    <div class="category-color" style="background-color: ${colors[colorIndex]}"></div>
                    <div class="category-info">
                        <div class="category-name">${this.formatCategoryName(category)}</div>
                        <div class="category-amount">$${amount.toFixed(2)}</div>
                    </div>
                </div>
            `;
            colorIndex = (colorIndex + 1) % colors.length;
        });

        breakdownDiv.innerHTML = breakdownHTML;
    }

    formatCategoryName(category) {
        const names = {
            'housing': 'Housing',
            'transportation': 'Transportation',
            'food': 'Food & Dining',
            'utilities': 'Utilities',
            'entertainment': 'Entertainment',
            'healthcare': 'Healthcare',
            'education': 'Education',
            'other': 'Other'
        };
        return names[category] || category;
    }

    generateAdvice(income, totalExpenses, savings, savingsRate, savingsGoal) {
        let advice = '';
        
        if (savings < 0) {
            advice = 'Your expenses exceed your income. Consider reducing non-essential expenses or finding additional income sources. Focus on creating an emergency fund once you achieve positive cash flow.';
        } else if (savingsRate < 10) {
            advice = 'Great job staying within your budget! Consider increasing your savings rate to 20% for better financial security. Look for areas where you can reduce expenses.';
        } else if (savingsRate < 30) {
            advice = 'Excellent savings rate! You\'re building a solid financial foundation. Consider investing your savings to grow your wealth over time.';
        } else {
            advice = 'Outstanding financial discipline! You\'re saving at an exceptional rate. Consider consulting with a financial advisor to optimize your investment strategy.';
        }

        // Add goal-specific advice
        if (savingsGoal > 0) {
            if (savings >= savingsGoal) {
                advice += ' Congratulations! You\'ve reached your savings goal. Consider setting a new, more ambitious target.';
            } else {
                const remaining = savingsGoal - savings;
                advice += ` You\'re $${remaining.toFixed(2)} away from your monthly savings goal. Keep up the great work!`;
            }
        }
        
        return advice;
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
        
        // Update button text
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            if (this.currentTheme === 'dark') {
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            } else {
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            }
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Update button text
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            if (this.currentTheme === 'dark') {
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            } else {
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            }
        }
    }

    resetBudget() {
        // Reset form
        document.getElementById('budget-form').reset();
        
        // Reset results
        document.getElementById('total-income').textContent = '$0.00';
        document.getElementById('total-expenses').textContent = '$0.00';
        document.getElementById('total-savings').textContent = '$0.00';
        document.getElementById('savings-rate').textContent = '0%';
        document.getElementById('advice-text').textContent = 'Enter your budget details to receive personalized financial advice.';
        
        // Reset progress bar and chart
        this.updateProgressBar(0);
        this.updateChart(0);
        
        // Reset goal indicator
        document.getElementById('goal-indicator').style.display = 'none';
        
        // Remove additional expense fields
        const expensesList = document.getElementById('expenses-list');
        const expenseItems = expensesList.querySelectorAll('.expense-item');
        
        expenseItems.forEach((item, index) => {
            if (index > 0) {
                item.remove();
            }
        });
        
        this.expenseCount = 1;
        
        // Clear charts
        if (this.charts.expenseChart) {
            this.charts.expenseChart.destroy();
            this.charts.expenseChart = null;
        }
        
        // Clear category breakdown
        const breakdownDiv = document.getElementById('category-breakdown');
        if (breakdownDiv) {
            breakdownDiv.innerHTML = '';
        }
        
        // Clear saved form data
        localStorage.removeItem('budgetFormData');
        
        // Show success message
        this.showNotification('Budget reset successfully!', 'success');
    }

    autoSaveForm() {
        const formData = {
            income: document.getElementById('income').value,
            savingsGoal: document.getElementById('savings-goal').value,
            expenses: []
        };

        const expenseNames = document.querySelectorAll('input[name="expense-name[]"]');
        const expenseAmounts = document.querySelectorAll('input[name="expense-amount[]"]');
        const expenseCategories = document.querySelectorAll('select[name="expense-category[]"]');

        expenseNames.forEach((input, index) => {
            formData.expenses.push({
                name: input.value,
                amount: expenseAmounts[index]?.value || '',
                category: expenseCategories[index]?.value || ''
            });
        });

        localStorage.setItem('budgetFormData', JSON.stringify(formData));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('budgetFormData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                if (data.income) {
                    document.getElementById('income').value = data.income;
                }
                if (data.savingsGoal) {
                    document.getElementById('savings-goal').value = data.savingsGoal;
                }
                if (data.expenses && data.expenses.length > 0) {
                    // Load saved expenses
                    data.expenses.forEach((expense, index) => {
                        if (index > 0) {
                            this.addExpenseField();
                        }
                        
                        const expenseItems = document.querySelectorAll('.expense-item');
                        const currentItem = expenseItems[index];
                        
                        if (currentItem) {
                            currentItem.querySelector('.expense-name').value = expense.name || '';
                            currentItem.querySelector('.expense-amount').value = expense.amount || '';
                            currentItem.querySelector('.expense-category').value = expense.category || '';
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }

    exportBudget() {
        if (!this.budgetData) {
            this.showNotification('No budget data to export', 'warning');
            return;
        }

        const dataStr = JSON.stringify(this.budgetData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Budget exported successfully!', 'success');
    }

    exportData() {
        const allData = {
            budgetHistory: JSON.parse(localStorage.getItem('budgetHistory') || '[]'),
            savedTemplates: JSON.parse(localStorage.getItem('budgetTemplates') || '[]'),
            currentBudget: this.budgetData
        };

        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-buddy-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('All data exported successfully!', 'success');
    }

    saveBudgetTemplate() {
        if (!this.budgetData) {
            this.showNotification('No budget data to save as template', 'warning');
            return;
        }

        const templateName = prompt('Enter a name for this budget template:');
        if (!templateName) return;

        const templates = JSON.parse(localStorage.getItem('budgetTemplates') || '[]');
        const newTemplate = {
            name: templateName,
            data: this.budgetData,
            createdAt: new Date().toISOString()
        };

        templates.push(newTemplate);
        localStorage.setItem('budgetTemplates', JSON.stringify(templates));
        
        this.showNotification(`Template "${templateName}" saved successfully!`, 'success');
    }

    compareWithPreviousMonth() {
        const history = JSON.parse(localStorage.getItem('budgetHistory') || '[]');
        if (history.length < 2) {
            this.showNotification('Need at least 2 months of data to compare', 'info');
            return;
        }

        const currentMonth = history[0];
        const previousMonth = history[1];

        const comparison = {
            income: ((currentMonth.income - previousMonth.income) / previousMonth.income * 100).toFixed(1),
            expenses: ((currentMonth.totalExpenses - previousMonth.totalExpenses) / previousMonth.totalExpenses * 100).toFixed(1),
            savings: ((currentMonth.savings - previousMonth.savings) / previousMonth.savings * 100).toFixed(1)
        };

        const message = `Month-over-month comparison:\n` +
            `Income: ${comparison.income}%\n` +
            `Expenses: ${comparison.expenses}%\n` +
            `Savings: ${comparison.savings}%`;

        alert(message);
    }

    saveAdvice() {
        if (!this.budgetData) {
            this.showNotification('No advice to save', 'warning');
            return;
        }

        const savedAdvice = JSON.parse(localStorage.getItem('savedAdvice') || '[]');
        const newAdvice = {
            advice: document.getElementById('advice-text').textContent,
            date: new Date().toISOString(),
            budgetData: this.budgetData
        };

        savedAdvice.push(newAdvice);
        localStorage.setItem('savedAdvice', JSON.stringify(savedAdvice));
        
        this.showNotification('Advice saved successfully!', 'success');
    }

    shareAdvice() {
        if (!this.budgetData) {
            this.showNotification('No advice to share', 'warning');
            return;
        }

        const advice = document.getElementById('advice-text').textContent;
        const shareText = `Budget Buddy Advice: ${advice}\n\nGenerated on: ${new Date().toLocaleDateString()}`;

        if (navigator.share) {
            navigator.share({
                title: 'Budget Buddy Financial Advice',
                text: shareText
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Advice copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy advice', 'error');
            });
        }
    }

    showDemoModal() {
        const modal = document.createElement('div');
        modal.className = 'demo-modal';
        modal.innerHTML = `
            <div class="demo-modal-content">
                <div class="demo-modal-header">
                    <h3>Schedule a Demo</h3>
                    <button class="demo-modal-close">&times;</button>
                </div>
                <div class="demo-modal-body">
                    <p>Thank you for your interest! Our team will contact you within 24 hours to schedule your personalized demo.</p>
                    <form class="demo-form">
                        <div class="form-group">
                            <label for="demo-name">Full Name</label>
                            <input type="text" id="demo-name" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="demo-email">Email Address</label>
                            <input type="email" id="demo-email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="demo-company">Company (Optional)</label>
                            <input type="text" id="demo-company" class="form-input">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Request Demo</button>
                    </form>
                </div>
            </div>
        `;

        // Add modal styles
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            .demo-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .demo-modal-content {
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideInUp 0.3s ease;
            }
            
            .demo-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .demo-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
            }
            
            .demo-modal-body {
                padding: 20px;
            }
            
            .demo-form .form-group {
                margin-bottom: 16px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideInUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(modalStyles);

        // Add event listeners
        const closeBtn = modal.querySelector('.demo-modal-close');
        closeBtn.addEventListener('click', () => modal.remove());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const demoForm = modal.querySelector('.demo-form');
        demoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.showNotification('Demo request submitted! We\'ll contact you soon.', 'success');
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    showNotification(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `notification-toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    saveToHistory(budget) {
        const history = JSON.parse(localStorage.getItem('budgetHistory') || '[]');
        
        // Add timestamp
        budget.timestamp = new Date().toISOString();
        
        // Add to beginning of array
        history.unshift(budget);
        
        // Keep only last 10 entries
        if (history.length > 10) {
            history.splice(10);
        }
        
        localStorage.setItem('budgetHistory', JSON.stringify(history));
    }

    collectFormData() {
        const income = parseFloat(document.getElementById('income').value) || 0;
        const savingsGoal = parseFloat(document.getElementById('savings-goal').value) || 0;
        const expenseInputs = document.querySelectorAll('input[name="expense-amount[]"]');
        const expenseNameInputs = document.querySelectorAll('input[name="expense-name[]"]');
        const expenseCategoryInputs = document.querySelectorAll('select[name="expense-category[]"]');
        
        const expenses = [];
        
        expenseInputs.forEach((input, index) => {
            const amount = parseFloat(input.value) || 0;
            const name = expenseNameInputs[index]?.value || `Expense ${index + 1}`;
            const category = expenseCategoryInputs[index]?.value || 'other';
            
            if (amount > 0) {
                expenses.push({ name, amount, category });
            }
        });
        
        return { income, expenses, savings_goal: savingsGoal };
    }

    saveBudgetToSupabase() {
        if (!this.budgetData) {
            this.showNotification('No budget data to save', 'warning');
            return;
        }
        // Ensure user id is included if authenticated
        if (window.BUDGET_BUDDY_USER && window.BUDGET_BUDDY_USER.isAuthenticated) {
            this.budgetData.user_id = window.BUDGET_BUDDY_USER.id;
        }

        this.ensureCsrfToken().then(() => fetch('/budget/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
            },
            body: JSON.stringify({
                action: 'save',
                ...this.budgetData
            })
        }))
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Budget saved to cloud successfully!', 'success');
            } else {
                this.showNotification(data.error || 'Failed to save budget', 'error');
            }
        })
        .catch(error => {
            console.error('Error saving budget:', error);
            this.showNotification('Failed to save budget. Please try again.', 'error');
        });
    }

    getCSRFToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }

    ensureCsrfToken() {
        const token = this.getCSRFToken();
        if (token) return Promise.resolve(token);
        return fetch('/budget/api/', { credentials: 'same-origin' }).then(() => this.getCSRFToken());
    }

    animateOnScroll() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll('.feature-card, .enhanced-feature-card, .calculator-form, .calculator-results');
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }

    initializeChart() {
        // Initialize the chart with 75% progress
        this.updateChart(75);
        this.updateProgressBar(75);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BudgetBuddy();
});

// Add smooth scrolling for all internal links
document.addEventListener('DOMContentLoaded', () => {
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add scroll effect for navbar
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Add loading styles
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        body:not(.loaded) {
            overflow: hidden;
        }
        
        body:not(.loaded)::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        body:not(.loaded)::after {
            content: '💰';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            z-index: 10000;
            animation: bounce 1s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translate(-50%, -50%) translateY(0); }
            40% { transform: translate(-50%, -50%) translateY(-20px); }
            60% { transform: translate(-50%, -50%) translateY(-10px); }
        }
    `;
    document.head.appendChild(loadingStyles);
});