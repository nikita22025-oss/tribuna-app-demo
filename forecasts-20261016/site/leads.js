/* Заявки рекламодателей: форма, проверка полей и отправка в CRM.
   Канал отправки задаётся в config.js → crm.provider. */
const leadFormats=[['leaderboard','Верхний баннер'],['sidebar','Боковой блок'],['native','Нативная история'],['special','Спецпроект «В сектор трибуны»'],['other','Другое / нужна консультация']];
const leadConfig=()=>{const c=window.TRIBUNA_CONFIG||{};return {crm:c.crm||{},contacts:c.contacts||{},siteUrl:c.siteUrl||''};};
function captureUTM(){try{const params=new URLSearchParams(String(location.search||''));const utm={};['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key=>{if(params.get(key))utm[key]=params.get(key);});if(Object.keys(utm).length&&typeof sessionStorage!=='undefined')sessionStorage.setItem('tribuna-utm',JSON.stringify(utm));}catch{}}
function storedUTM(){try{return JSON.parse(sessionStorage.getItem('tribuna-utm')||'{}');}catch{return {};}}
function leadFormHTML(){
 const {crm,contacts}=leadConfig();
 if(crm.provider==='embed'&&crm.embedHtml)return `<div class="lead-form lead-embed" id="lead-form" data-lead-embed><h2>Оставить заявку</h2></div>`;
 return `<form class="lead-form" id="lead-form" novalidate data-lead-form><div class="lead-heading"><h2>Оставить заявку</h2><p>Расскажите о задаче — вернёмся с предложением и медиакитом.</p></div><div class="lead-grid"><label><span>Компания или бренд</span><input name="company" type="text" autocomplete="organization" required maxlength="120"></label><label><span>Как к вам обращаться</span><input name="name" type="text" autocomplete="name" required maxlength="80"></label><label><span>Электронная почта</span><input name="email" type="email" autocomplete="email" required maxlength="120" inputmode="email"></label><label><span>Телефон или Telegram</span><input name="phone" type="text" autocomplete="tel" maxlength="60"></label><label class="lead-wide"><span>Формат размещения</span><select name="format">${leadFormats.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><label class="lead-wide"><span>Задача</span><textarea name="message" rows="4" maxlength="2000" placeholder="Что продвигаем, сроки, ориентир по бюджету"></textarea></label></div><label class="lead-consent"><input type="checkbox" name="consent" required><span>Соглашаюсь на обработку персональных данных по <a href="/privacy">политике конфиденциальности</a></span></label><input type="text" name="website" tabindex="-1" autocomplete="off" class="lead-trap" aria-hidden="true"><div class="lead-actions"><button type="submit" class="lead-submit">Отправить заявку <span aria-hidden="true">↗</span></button><span class="lead-hint">Ответим в течение рабочего дня${contacts.email?`, или напишите на <a href="mailto:${contacts.email}">${contacts.email}</a>`:''}.</span></div><p class="lead-status" role="status" aria-live="polite"></p></form>`;
}
function validateLead(data){
 const errors={};const text=key=>String(data[key]||'').trim();
 if(text('company').length<2)errors.company='Укажите компанию или бренд';
 if(text('name').length<2)errors.name='Укажите, как к вам обращаться';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text('email')))errors.email='Проверьте адрес электронной почты';
 if(text('message').length>2000)errors.message='Слишком длинное сообщение';
 if(!leadFormats.some(([value])=>value===text('format')))errors.format='Выберите формат';
 if(!data.consent)errors.consent='Нужно согласие на обработку данных';
 return errors;
}
function leadPayload(data){
 const {crm,siteUrl}=leadConfig();const format=leadFormats.find(([value])=>value===data.format);
 return {source:crm.sourceName||'Трибуна.ру',site:siteUrl,page:String(location.href||''),sentAt:new Date().toISOString(),company:String(data.company||'').trim(),name:String(data.name||'').trim(),email:String(data.email||'').trim(),phone:String(data.phone||'').trim(),format:data.format,formatLabel:format?format[1]:'',message:String(data.message||'').trim(),consent:true,utm:storedUTM(),ymClientId:data.ymClientId||''};
}
function leadMailto(payload,email){
 const lines=[`Компания: ${payload.company}`,`Контакт: ${payload.name}`,`Почта: ${payload.email}`,payload.phone?`Телефон/Telegram: ${payload.phone}`:'',`Формат: ${payload.formatLabel}`,'',payload.message,'',`Страница: ${payload.page}`,'Согласие на обработку персональных данных: да'].filter(line=>line!==undefined);
 return `mailto:${email}?subject=${encodeURIComponent(`Заявка на рекламу — ${payload.company}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
function bitrixFields(payload){
 const utm=payload.utm||{};
 return {TITLE:`Реклама на Трибуне: ${payload.company}`,NAME:payload.name,COMPANY_TITLE:payload.company,EMAIL:[{VALUE:payload.email,VALUE_TYPE:'WORK'}],PHONE:payload.phone?[{VALUE:payload.phone,VALUE_TYPE:'WORK'}]:[],COMMENTS:`Формат: ${payload.formatLabel}\n\n${payload.message}\n\nСтраница: ${payload.page}${payload.ymClientId?`\nYandex ClientID: ${payload.ymClientId}`:''}`,SOURCE_ID:'WEB',SOURCE_DESCRIPTION:payload.source,UTM_SOURCE:utm.utm_source||'',UTM_MEDIUM:utm.utm_medium||'',UTM_CAMPAIGN:utm.utm_campaign||'',UTM_CONTENT:utm.utm_content||'',UTM_TERM:utm.utm_term||''};
}
async function sendLead(data,options={}){
 const {crm,contacts}=leadConfig();const payload=leadPayload(data);const provider=crm.provider||'email';
 if(provider==='webhook'){if(!crm.endpoint)throw new Error('Не задан адрес приёма заявок');const response=await fetch(crm.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok)throw new Error(`Сервер ответил ${response.status}`);return {ok:true,channel:'webhook'};}
 if(provider==='bitrix24'){if(!crm.endpoint)throw new Error('Не задан вебхук Битрикс24');const url=crm.endpoint.replace(/\/?$/,'/')+'crm.lead.add.json';const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:bitrixFields(payload)})});const result=response.ok?await response.json():null;if(!result||result.error)throw new Error(result?.error_description||`Битрикс24 ответил ${response.status}`);return {ok:true,channel:'bitrix24',id:result.result};}
 if(!contacts.email)throw new Error('Не настроен канал приёма заявок');
 const url=leadMailto(payload,contacts.email);if(options.navigate!==false)location.href=url;return {ok:true,channel:'email',url};
}
function readLeadForm(form){const data={};form.querySelectorAll('[name]').forEach(field=>{data[field.name]=field.type==='checkbox'?field.checked:field.value;});return data;}
function showLeadErrors(form,errors){form.querySelectorAll('[name]').forEach(field=>{const message=errors[field.name];field.setAttribute('aria-invalid',message?'true':'false');const label=field.closest('label');if(label){let note=label.querySelector('.lead-error');if(message){if(!note){note=document.createElement('small');note.className='lead-error';label.appendChild(note);}note.textContent=message;}else note?.remove();}});}
async function handleLeadSubmit(form){
 const data=readLeadForm(form);const status=form.querySelector('.lead-status');const button=form.querySelector('.lead-submit');const {contacts}=leadConfig();
 if(data.website){form.innerHTML='<div class="lead-heading"><h2>Спасибо!</h2><p>Заявка получена.</p></div>';return;}
 const errors=validateLead(data);showLeadErrors(form,errors);
 if(Object.keys(errors).length){status.textContent='Проверьте выделенные поля.';form.querySelector('[aria-invalid="true"]')?.focus();return;}
 status.textContent='Отправляем…';button.disabled=true;
 if(typeof tribunaClientId==='function')data.ymClientId=await tribunaClientId();
 try{const result=await sendLead(data);if(typeof tribunaTrack==='function')tribunaTrack('lead_submit',{format:data.format,channel:result.channel});form.innerHTML=`<div class="lead-heading"><h2>Спасибо!</h2><p>${result.channel==='email'?'Мы открыли письмо в вашей почтовой программе — просто отправьте его. Если письмо не открылось, напишите на '+(contacts.email?`<a href="mailto:${contacts.email}">${contacts.email}</a>`:'почту редакции')+'.':'Заявка получена. Ответим в течение рабочего дня.'}</p></div>`;}
 catch(error){console.error('lead failed',error);if(typeof tribunaTrack==='function')tribunaTrack('lead_error',{message:String(error.message||error)});status.textContent=`Не получилось отправить заявку${contacts.email?`. Напишите нам на ${contacts.email}`:''}.`;button.disabled=false;}
}
function initLeadEmbed(){const holder=document.querySelector('[data-lead-embed]');const {crm}=leadConfig();if(!holder||!crm.embedHtml||holder.dataset.ready)return;holder.dataset.ready='1';const template=document.createElement('div');template.innerHTML=crm.embedHtml;template.querySelectorAll('script').forEach(old=>{const script=document.createElement('script');[...old.attributes].forEach(attr=>script.setAttribute(attr.name,attr.value));script.textContent=old.textContent;old.replaceWith(script);});holder.appendChild(template);}
document.addEventListener('submit',event=>{const form=typeof event.target.closest==='function'?event.target.closest('[data-lead-form]'):null;if(!form)return;event.preventDefault();handleLeadSubmit(form);});
document.addEventListener('focusin',event=>{const form=typeof event.target.closest==='function'?event.target.closest('[data-lead-form]'):null;if(form&&!form.dataset.opened){form.dataset.opened='1';if(typeof tribunaTrack==='function')tribunaTrack('lead_form_open',{});}});
captureUTM();
