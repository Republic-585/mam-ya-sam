
  (function(){
    const input=document.getElementById('faqSearch');
    const clearButton=document.getElementById('faqSearchClear');
    const list=document.getElementById('faqList');
    const empty=document.getElementById('faqEmpty');
    const tabs=Array.from(document.querySelectorAll('[data-faq-category]'));
    if(!input||!clearButton||!list||!empty)return;
    const items=Array.from(list.querySelectorAll('details'));
    let activeCategory='all';
    const normalize=value=>value.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
    function syncClearButton(){
      clearButton.hidden=input.value.length===0;
    }
    function filterItems(){
      const query=normalize(input.value);
      let visible=0;
      items.forEach(item=>{
        const categoryMatch=activeCategory==='all'||item.dataset.category===activeCategory;
        const textMatch=!query||normalize(item.textContent).includes(query);
        const matches=categoryMatch&&textMatch;
        item.hidden=!matches;
        if(matches)visible++;
      });
      empty.hidden=visible!==0;
      syncClearButton();
    }
    input.addEventListener('input',filterItems);
    clearButton.addEventListener('click',()=>{
      input.value='';
      filterItems();
      input.focus();
    });
    syncClearButton();
    tabs.forEach(tab=>tab.addEventListener('click',()=>{
      activeCategory=tab.dataset.faqCategory;
      tabs.forEach(item=>item.setAttribute('aria-pressed',String(item===tab)));
      filterItems();
    }));
  })();
  