// 後台角色：網址加 `?role=agent` 切到代理後台，沒有參數就是站長後台。
// 兩個角色只差側欄底色（--sidebar／--sidebar-end 在 :root[data-role="agent"] 改指向代理那一組），
// 這支只負責把參數寫到 <html data-role>，配色都在 styles/blue-teal-palette-override.css。
const role = new URLSearchParams(location.search).get('role') === 'agent' ? 'agent' : 'owner'
document.documentElement.dataset.role = role
