import './reader-reading-bar.css';

// Fit width stays in the common navigation row in every mode. Fit page is a
// separate whole-page fit method. Reading borrows its real button and Pages;
// Build gets them back
// before its group adapter runs: no duplicate callback or tool implementation.
export function installReadingBar(reader){
 let active=false,moved=[];const width=reader.root.querySelector('[data-action=fit]');
 function setView(view){
  if(view===active)return;active=view;
  if(!view){for(const {button,anchor}of moved){button.classList.remove('reader-reading-shortcut');anchor.replaceWith(button);}moved=[];return;}
  for(const action of ['fit-page','thumbnails']){
   const button=reader.root.querySelector('[data-action='+action+']');if(!button)continue;
   const anchor=reader.root.ownerDocument.createComment('build reading tool');button.before(anchor);moved.push({button,anchor});button.classList.add('reader-reading-shortcut');
   if(action==='fit-page')width.after(button);else reader.root.querySelector('.reader-tools').insertBefore(button,reader.root.querySelector('[data-action=print]'));
  }
 }
 return {setView,dispose(){setView(false);}};
}
