//BUDGET CONTROLLER
var budgetcontroller = (function () {
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercent = function(totalIncome){
        if(totalIncome>0){
            this.percentage = Math.round(this.value/totalIncome * 100);
        }else{
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function(){
        return this.percentage;
    }

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function(type){
        var sum = 0;
        data.allItems[type].forEach(function(curr){
            sum+=curr.value;
        });
        
        data.totals[type] = sum;
    }

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    return {
        addItem: function (type, des, val) {
            var newItem, Id;

            // Create new Id
            // new id = last id of that type +1
            if (data.allItems[type].length > 0) {
                Id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                Id = 0;
            }

            //create new item based on inc or exp
            if (type === 'exp') {
                newItem = new Expense(Id, des, val);
            } else if (type === 'inc') {
                newItem = new Income(Id, des, val);
            }

            //push it into our data structure
            data.allItems[type].push(newItem);

            //Return the new element
            return newItem;
        },

        deleteItem: function(type, id){
            var ids,index;
            //ID EXAMPLE:[1 2 4 6 8] find index for given id
            ids = data.allItems[type].map(function(curr){
                return curr.id;
            });
            index= ids.indexOf(id);
            if(index !== -1){
                data.allItems[type].splice(index,1);
            }
        },

        calculateBudget: function(){

            //calculate total income and expense
            calculateTotal("exp");
            calculateTotal("inc");
            //calculate budget income - expenses
            data.budget = data.totals.inc - data.totals.exp;
            //calculate percentage of expenses
            if(data.totals.inc>0){
                data.percentage = Math.round( data.totals.exp/data.totals.inc * 100);
            }else{
                data.percentage=-1;
            }
            

        },

        calculatePercentages: function(){
            data.allItems.exp.forEach(function(curr){
                curr.calcPercent(data.totals.inc);
            });
        },

        getPercentages: function(){
            var allPer = data.allItems.exp.map(function(curr){
                return curr.getPercentage();
            });
            return allPer;
        },

        getBudget: function(){
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        }
    };

})();



//UI CONTROLLER
var UIcontroller = (function () {
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expPerLabel: '.item__percentage',
        monthLabel: '.budget__title--month'
    };

    var formatNumber =  function(type,num){
        /**+ or - according to type
         * exactly 2 decimal points
         * comma seperated the thousands
         * 
         * ex 2345 -> + 2,345.00
         */
        var numSplit, int, deci, sign;

        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split('.');
        int = numSplit[0];
        if(int.length>3)
        {
            int = int.substr(0,int.length-3) + ',' + int.substr(int.length-3,3);
        }
        deci = numSplit[1]; 
        type=== 'exp' ? sign ='-' :sign ='+';
        return sign+' '+int+'.'+deci;
    };

    var nodeListForEach = function(list, callback){
        for(var i =0;i<list.length;i++)
        {
            callback(list[i],i);
        }
    };

    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value, //will either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        addListItem: function (obj, type) {
            var html, newhtml, element;


            //create HTML Strings with placeholder text
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMstrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%pecent%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }


            //replace placeholder text with some actual data
            newhtml = html.replace('%id%',obj.id);
            newhtml = newhtml.replace('%description%',obj.description);
            newhtml = newhtml.replace('%value%', formatNumber(type, obj.value));

            //Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend',newhtml);

        },

        deleteListItem: function(selectorId){
            /**we cannot directly delete element of given id
             * we can only delete a child element so we will first get its parent node
             * then delete its child for given id
             */
            var element;
            element = document.getElementById(selectorId);
            element.parentNode.removeChild(element);
        },

        clearFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(curr,i,arr){
                curr.value = "";
            });

            fieldsArr[0].focus();
        },

        displayBudget: function(obj) {
            var type;
            obj.budget>=0 ? type= 'inc': type='exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(type, obj.budget);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber("inc", obj.totalInc);
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber("exp", obj.totalExp);
            if(obj.percentage>0){
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage +'%';
            }else{
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },

        displayPercentages: function(percentages){
            var fields;
            fields= document.querySelectorAll(DOMstrings.expPerLabel);

            nodeListForEach(fields,function(curr,index){
                if(percentages[index]>0){
                    curr.textContent = percentages[index] + '%';
                }else{
                    curr.textContent = '---';
                }
                
            });
        },

        displayMonth: function(){
            var now, year, month,monthName;

            now = new Date();
            monthName = ['January','Feburary','March','April','May','June','July','August','September','October','November','December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.monthLabel).textContent = monthName[month]+' '+year;
        },

        changeType: function(){
            var fields = document.querySelectorAll(DOMstrings.inputType+','+DOMstrings.inputDescription+','+DOMstrings.inputValue);
            nodeListForEach(fields,function(curr){
                curr.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        getDOMstrings: function () {
            return DOMstrings;
        }
    };

})();



//GLOBAL APP CONTROLLER
var controller = (function (budgetctrl, UIctrl) {
    
    var setupEventListner = function () {
        var DOM = UIctrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UIctrl.changeType);
    };

    var updateBudget = function(){
        
        //1.calculate the budget
        budgetctrl.calculateBudget();
        //2.return the budget
        budget = budgetctrl.getBudget();
        //3.display the budget to the ui
        UIctrl.displayBudget(budget);
    };

    var updatePercentages = function(){
        //1.calculate percentages
        budgetctrl.calculatePercentages();
        
        //2.read percentages from budget controller
        var percentages = budgetctrl.getPercentages();

        //3.update the ui with new percentages
        UIctrl.displayPercentages(percentages);
    } 

    var ctrlAddItem = function () {
        var input, newItem;

        //1. Get Input from UI
        input = UIctrl.getInput();

        if(input.description!=="" && !isNaN(input.value) && input.value>0){
            //2. ADD item to our data structure;
            newItem = budgetctrl.addItem(input.type, input.description, input.value);

            //3.ADD the item to ui
            UIctrl.addListItem(newItem,input.type);

            //4. clear the fields
            UIctrl.clearFields();

            //5. calculate and update budget
            updateBudget();

            //6.calculate and update the percentages of expense
            updatePercentages();
        }else{
            alert("Provide Valid Input :))");
        }
        
        
    };

    var ctrlDeleteItem = function(event){
        var itemId, splitId, type, id;

        itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if(itemId){
            splitId = itemId.split('-');
            type = splitId[0];
            id =  parseInt(splitId[1]);

            //1.delete the item from datastructure
            budgetctrl.deleteItem(type,id);

            //2.delete the item from ui
            UIctrl.deleteListItem(itemId);

            //3.update the budget
            updateBudget();

            //4.calculate and update the expense percentages
            updatePercentages(); 
        }
    };

    return {
        init: function () {
            console.log('Application has started.');
            UIctrl.displayMonth();
            UIctrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });

            setupEventListner();
        }
    }

})(budgetcontroller, UIcontroller);

controller.init();