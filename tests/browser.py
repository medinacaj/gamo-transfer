"""Pruebas de navegador con Playwright. GAMO_BROWSER=chromium|firefox|webkit."""
import csv, json, os, subprocess, sys, time, unittest
from urllib.request import urlopen
from urllib.error import URLError
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

class DemoTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1','--directory',str(Path(__file__).resolve().parents[1])],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  for attempt in range(40):
   try:
    with urlopen('http://127.0.0.1:8765/', timeout=1) as response:
     if response.status == 200: break
   except (URLError, TimeoutError):
    time.sleep(.25)
  else:
   cls.server.terminate()
   raise RuntimeError('No se pudo iniciar el servidor HTTP de pruebas')
  cls.pw=sync_playwright().start()
  browser_name=os.environ.get('GAMO_BROWSER','chromium').lower()
  if browser_name not in ('chromium','firefox','webkit'):
   raise RuntimeError(f'GAMO_BROWSER no soportado: {browser_name}')
  launch={'headless':True}
  if browser_name=='chromium':
   launch['args']=['--no-sandbox','--disable-dev-shm-usage']
   browser_path=os.environ.get('GAMO_CHROMIUM_PATH')
   if browser_path: launch['executable_path']=browser_path
  cls.browser=getattr(cls.pw,browser_name).launch(**launch)
 @classmethod
 def tearDownClass(cls):
  cls.browser.close();cls.pw.stop();cls.server.terminate();cls.server.wait()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,reduced_motion='reduce')
  self.page=self.context.new_page();self.errors=[]
  self.page.on('pageerror',lambda error:self.errors.append(str(error)))
  self.page.goto('http://127.0.0.1:8765/',wait_until='domcontentloaded')
 def tearDown(self):
  result=getattr(getattr(self,'_outcome',None),'result',None)
  failed=bool(self.errors) or bool(result and any(test is self for test,_ in result.failures+result.errors))
  if failed:
   try:
    self.page.screenshot(path=f'/tmp/gamo-failed-{self._testMethodName}.png',full_page=True)
   except Exception:
    pass  # El error de la prueba original tiene prioridad.
  try:
   self.assertEqual(self.errors,[])
  finally:
   self.context.close()
 def test_premium_v2_palette_and_real_dashboard_controls(self):
  # Computed CSS; no invented business values or unlicensed interface assets.
  expect(self.page.locator('body')).to_have_attribute('data-theme','dark')
  expect(self.page.locator('h1')).to_have_text('Centro de operaciones')
  expect(self.page.locator('.operations-intro')).to_be_visible()
  state=self.page.evaluate("""() => {
    const style=s=>getComputedStyle(document.querySelector(s));
    return {
      canvas:style('body').backgroundColor,
      heroImage:style('.operations-intro').backgroundImage,
      vehicle:style('.operations-photo').backgroundImage,
      board:style('.operations-service-board').backgroundImage,
      highlighted:style('.operations-service-detail').backgroundImage,
      action:style('.operations-intro-actions .btn-accent').backgroundImage,
      plainList:style('.history-source-flat').backgroundColor,
      rows:document.querySelectorAll('.operations-service-row').length,
      kpis:document.querySelectorAll('.dashboard-ops-overview .kpi').length,
      chart:document.querySelectorAll('.operations-week-col').length
    };
  }""")
  self.assertEqual(state['canvas'],'rgb(6, 13, 23)')
  self.assertIn('images.unsplash.com',state['heroImage'])
  self.assertIn('executive-van.svg',state['vehicle'])
  self.assertIn('gradient',state['board'])
  self.assertIn('gradient',state['highlighted'])
  self.assertIn('gradient',state['action'])
  self.assertEqual(state['plainList'],'rgba(0, 0, 0, 0)')
  self.assertEqual(state['rows'],5)
  self.assertEqual(state['kpis'],4)
  self.assertEqual(state['chart'],7)
  self.page.locator('[data-ui-preference="theme"]').click()
  expect(self.page.locator('body')).to_have_attribute('data-theme','light')
  self.assertEqual(self.page.evaluate('getComputedStyle(document.body).backgroundColor'),'rgb(238, 240, 243)')
  expect(self.page.locator('.operations-intro')).to_be_visible()

 def test_operations_dashboard_has_distinct_composition(self):
  expect(self.page.locator('h1')).to_have_text('Centro de operaciones')
  expect(self.page.locator('.operations-intro')).to_be_visible()
  expect(self.page.locator('.operations-hero-stat')).to_be_visible()
  self.assertEqual(self.page.locator('.dashboard-ops-overview .kpi').count(),4)
  self.assertEqual(self.page.locator('.operations-service-row').count(),5)
  expect(self.page.locator('#dashboard-service-detail')).to_be_visible()
  # Selection must update the blue details, not just a CSS class.
  rows=self.page.locator('.operations-service-row')
  second=rows.nth(1)
  second_id=second.get_attribute('data-id')
  second.click()
  expect(self.page.locator('[data-action="dashboard-select"][data-id="'+second_id+'"]')).to_have_attribute('aria-pressed','true')
  expect(self.page.locator('.operations-detail-id')).to_contain_text(second_id)
  expect(self.page.locator('.history-ledger-intro')).to_be_visible()
  self.assertEqual(self.page.locator('.history-source-item').count(),2)
  self.assertEqual(self.page.locator('.dashboard-finance-layout .kpi').count(),4)
  self.assertEqual(self.page.locator('.dashboard-finance-chart .bar-chart').count(),1)
  desktop=self.page.evaluate("""() => ({
    hero:getComputedStyle(document.querySelector('.operations-intro')).display,
    signals:getComputedStyle(document.querySelector('.ops-kpis')).gridTemplateColumns,
    triad:getComputedStyle(document.querySelector('.dashboard-triad')).gridTemplateColumns,
    finance:getComputedStyle(document.querySelector('.dashboard-finance-layout')).gridTemplateColumns
  })""")
  self.assertEqual(desktop['hero'],'grid')
  self.assertEqual(len(desktop['signals'].split(' ')),4)
  self.assertGreaterEqual(len(desktop['triad'].split(' ')),2)
  self.assertEqual(len(desktop['finance'].split(' ')),2)
  self.page.set_viewport_size({'width':390,'height':844})
  mobile=self.page.evaluate("""() => ({
    hero:getComputedStyle(document.querySelector('.operations-intro')).gridTemplateColumns,
    triad:getComputedStyle(document.querySelector('.dashboard-triad')).gridTemplateColumns,
    kpiColumns:getComputedStyle(document.querySelector('.ops-kpis')).gridTemplateColumns,
    overflow:document.documentElement.scrollWidth-innerWidth
  })""")
  self.assertEqual(len(mobile['hero'].split(' ')),1)
  self.assertEqual(len(mobile['triad'].split(' ')),1)
  self.assertEqual(len(mobile['kpiColumns'].split(' ')),2)
  self.assertLessEqual(mobile['overflow'],0)

 def test_section_dividers_and_compact_mode_reduces_actual_height(self):
  # Esperar al resultado estable del render y al cómputo de CSS.
  # Un cambio de hash puede sustituir temporalmente los nodos de la vista.
  expect(self.page.locator('h1')).to_have_text('Centro de operaciones')
  self.page.wait_for_function("""() => {
    const sections = [...document.querySelectorAll('.dashboard-zone')];
    return sections.length === 3 && sections.slice(1).every(
      el => el.isConnected && getComputedStyle(el).borderTopWidth === '1px'
    );
  }""", timeout=7000)
  sections=self.page.locator('.dashboard-zone')
  for section in [sections.nth(1),sections.nth(2)]:
   expect(section).to_be_visible()
  comfortable_kpi=self.page.locator('.dashboard-zone-ops .kpi').first.bounding_box()['height']
  comfortable_chart=self.page.locator('.bar-chart').evaluate('el => parseFloat(getComputedStyle(el).height)')
  compact_btn=self.page.locator('[data-ui-preference="density"]')
  compact_btn.click()
  expect(self.page.locator('body')).to_have_attribute('data-density','compact')
  compact_kpi=self.page.locator('.dashboard-zone-ops .kpi').first.bounding_box()['height']
  compact_chart=self.page.locator('.bar-chart').evaluate('el => parseFloat(getComputedStyle(el).height)')
  self.assertLess(compact_kpi,comfortable_kpi-12,(comfortable_kpi,compact_kpi))
  self.assertLess(compact_chart,comfortable_chart-35,(comfortable_chart,compact_chart))
  self.navigate('reservas')
  td=self.page.locator('#booking-results tbody td').first
  compact_padding=td.evaluate('el => parseFloat(getComputedStyle(el).paddingTop)')
  compact_btn.click()
  expect(self.page.locator('body')).to_have_attribute('data-density','comfortable')
  comfortable_padding=td.evaluate('el => parseFloat(getComputedStyle(el).paddingTop)')
  self.assertLess(compact_padding,comfortable_padding,(compact_padding,comfortable_padding))
  self.navigate('inicio')
  self.page.locator('[data-ui-preference="theme"]').click()
  expect(self.page.locator('body')).to_have_attribute('data-theme','light')
  self.page.locator('[data-ui-preference="theme"]').click()
  expect(self.page.locator('body')).to_have_attribute('data-theme','dark')
  self.assertEqual(self.page.locator('.dashboard-zone-history').evaluate('el => getComputedStyle(el).borderTopWidth'),'1px')

 def test_theme_density_advanced_filters_and_report(self):
  theme=self.page.locator('[data-ui-preference="theme"]')
  density=self.page.locator('[data-ui-preference="density"]')
  expect(self.page.locator('body')).to_have_attribute('data-theme','dark')
  theme.click()
  expect(self.page.locator('body')).to_have_attribute('data-theme','light')
  theme.click()
  expect(self.page.locator('body')).to_have_attribute('data-theme','dark')
  density.click()
  expect(self.page.locator('body')).to_have_attribute('data-density','compact')
  self.page.reload()
  expect(self.page.locator('body')).to_have_attribute('data-theme','dark')
  expect(self.page.locator('body')).to_have_attribute('data-density','compact')
  self.navigate('reservas')
  self.page.locator('#booking-advanced summary').click()
  self.page.locator('#booking-origin').fill('zzz__unknown__')
  expect(self.page.locator('#booking-count')).to_contain_text('0 de')
  self.page.locator('#booking-reset').click()
  expect(self.page.locator('#booking-origin')).to_have_value('')
  self.navigate('reportes-agencias')
  expect(self.page.locator('#k-count')).to_have_text('22')
  self.page.locator('#report-from').fill('2026-10-25')
  expect(self.page.locator('#report-filter-count')).to_have_text('3 de 22 servicios')
  self.page.locator('#report-clear').click()
  expect(self.page.locator('#k-total')).to_have_text('$ 993.500')


 def test_no_horizontal_table_or_agenda_scroll(self):
  # All detail fields remain accessible; the table/card switches with panel width.
  base='http://127.0.0.1:8765/#/'
  for width in [390,768,1200,1600]:
   self.page.set_viewport_size({'width':width,'height':900})
   for route in ['inicio','reservas','agenda','clientes','conductores','vehiculos',
                 'facturacion','cobros','finanzas','reportes','reportes-agencias']:
    self.page.goto(base+route)
    expect(self.page.locator('h1')).to_be_visible()
    checks=self.page.evaluate("""() => ({
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      tables: [...document.querySelectorAll('.table-scroll')].map(x => ({
        width: x.clientWidth,
        excess: x.scrollWidth - x.clientWidth
      })),
      agenda: [...document.querySelectorAll('.agenda-grid')].map(x => x.scrollWidth - x.clientWidth)
    })""")
    self.assertLessEqual(checks['documentOverflow'],2,(width,route,'page',checks))
    for wrapper in checks['tables']:
     self.assertLessEqual(wrapper['excess'],2,(width,route,'table',wrapper))
    for excess in checks['agenda']:
     self.assertLessEqual(excess,2,(width,route,'agenda',excess))

 def test_invalid_route_and_modal_focus_isolation(self):
  self.page.goto('http://127.0.0.1:8765/#/constructor')
  expect(self.page.locator('h1')).to_have_text('Centro de operaciones')
  self.navigate('reservas')
  self.page.get_by_role('button',name='Nueva reserva',exact=True).click()
  expect(self.page.locator('[role=dialog]')).to_be_visible()
  self.assertTrue(self.page.evaluate("document.querySelector('#shell').inert"))
  self.page.keyboard.press('Escape')
  expect(self.page.locator('[role=dialog]')).to_have_count(0)
  self.assertFalse(self.page.evaluate("document.querySelector('#shell').inert"))
  self.navigate('clientes')
  self.page.get_by_role('button',name='Ver cuenta',exact=True).first.click()
  expect(self.page.locator('[role=dialog]')).to_be_visible()
  self.assertTrue(self.page.evaluate("document.querySelector('#shell').inert"))
  self.page.get_by_role('button',name='Cerrar',exact=True).click()
  self.assertFalse(self.page.evaluate("document.querySelector('#shell').inert"))

 def test_forms_cancel_and_keyboard_skip_without_side_effects(self):
  initial=len(self.data()['bookings']) if self.page.evaluate("localStorage.getItem('gamo.demo.v1')") else 28
  self.page.locator('#skip-to-content').focus()
  expect(self.page.locator('#skip-to-content')).to_be_visible()
  self.page.locator('#skip-to-content').click()
  self.assertEqual(self.page.evaluate('document.activeElement.id'),'content')
  self.navigate('reservas')
  self.page.get_by_role('button',name='Nueva reserva',exact=True).click()
  expect(self.page.locator('[role=dialog]')).to_be_visible()
  cancel=self.page.get_by_role('button',name='Cancelar',exact=True)
  self.assertEqual(cancel.get_attribute('type'),'button')
  cancel.click()
  expect(self.page.locator('[role=dialog]')).to_have_count(0)
  expect(self.page.get_by_role('button',name='Nueva reserva',exact=True)).to_be_focused()
  stored=self.page.evaluate("localStorage.getItem('gamo.demo.v1')")
  self.assertTrue(stored is None or len(self.data()['bookings'])==initial)

 def test_reservation_csv_matches_current_filters(self):
  self.navigate('reservas')
  self.page.locator('#booking-search').fill('Pasajero demo 1')
  shown=self.page.locator('#booking-results tbody tr').count()
  self.assertGreater(shown,0)
  self.assertLess(shown,28)
  with self.page.expect_download() as dl:
   self.page.get_by_role('button',name='Exportar CSV',exact=True).click()
  with open(dl.value.path(),encoding='utf-8-sig',newline='') as f:
   rows=list(csv.reader(f,delimiter=';'))
  self.assertEqual(len(rows),shown+1)
  self.assertEqual(rows[0][0],'ID')
  self.page.locator('#booking-search').fill('ZZZ_NO_MATCH_123')
  with self.page.expect_download() as dl:
   self.page.get_by_role('button',name='Exportar CSV',exact=True).click()
  with open(dl.value.path(),encoding='utf-8-sig',newline='') as f:
   rows=list(csv.reader(f,delimiter=';'))
  self.assertEqual(len(rows),1)

 def test_card_shadows_and_hover_in_light_and_dark(self):
  # Comparar estilos computados: deben existir sombras y cambiar con el hover.
  self.assertTrue(self.page.evaluate("matchMedia('(hover: hover) and (pointer: fine)').matches"))
  for theme in ['light','dark']:
   actual=self.page.locator('body').get_attribute('data-theme') or 'light'
   if actual!=theme:
    self.page.locator('[data-ui-preference="theme"]').click()
   expect(self.page.locator('body')).to_have_attribute('data-theme',theme)
   for selector in ['.kpi','.dashboard-alert-column .panel','.history-source-item']:
    card=self.page.locator(selector).first
    expect(card).to_be_visible()
    self.page.mouse.move(0,0)
    idle=card.evaluate('(el) => getComputedStyle(el).boxShadow')
    card.hover()
    active=card.evaluate('(el) => getComputedStyle(el).boxShadow')
    self.assertNotEqual(idle,'none',(theme,selector,'missing shadow'))
    self.assertNotEqual(idle,active,(theme,selector,'no hover effect'))
  self.navigate('clientes')
  card=self.page.locator('.entity-card').first
  idle=card.evaluate('(el) => getComputedStyle(el).boxShadow')
  card.hover()
  active=card.evaluate('(el) => getComputedStyle(el).boxShadow')
  self.assertNotEqual(idle,active,('dark','entity card','no hover effect'))

 def test_collections_are_unboxed_but_individual_cards_remain_elevated(self):
  # No card inside a larger card in dashboard, reservations and client details.
  for theme in ['light','dark']:
   actual=self.page.locator('body').get_attribute('data-theme') or 'light'
   if actual!=theme: self.page.locator('[data-ui-preference="theme"]').click()
   expect(self.page.locator('body')).to_have_attribute('data-theme',theme)
   for outer in ['.history-source-flat']:
    frame=self.page.locator(outer).first
    expect(frame).to_be_visible()
    state=frame.evaluate("""el => ({
      shadow:getComputedStyle(el).boxShadow,
      border:getComputedStyle(el).borderTopWidth,
      background:getComputedStyle(el).backgroundColor
    })""")
    self.assertEqual(state['shadow'],'none',(theme,outer,'shadow'))
    self.assertEqual(state['border'],'0px',(theme,outer,'border'))
    self.assertEqual(state['background'],'rgba(0, 0, 0, 0)',(theme,outer,'background'))
   for card in ['.history-source-item','.kpi']:
    self.assertNotEqual(self.page.locator(card).first.evaluate('el => getComputedStyle(el).boxShadow'),'none',(theme,card))
  self.navigate('reservas')
  expect(self.page.locator('#booking-results.panel--collection')).to_be_visible()
  self.assertEqual(self.page.locator('#booking-results').evaluate('el => getComputedStyle(el).boxShadow'),'none')
  self.navigate('clientes')
  expect(self.page.locator('.entity-card').first).to_be_visible()
  self.assertEqual(self.page.locator('.entity-meta').first.evaluate('el => getComputedStyle(el).boxShadow'),'none')

 def test_local_loading_baseline(self):
  # CI-only reference. These numbers are not real-user Web Vitals.
  self.page.reload(wait_until='load')
  metrics=self.page.evaluate("""() => {
    const nav=performance.getEntriesByType('navigation')[0];
    const resources=performance.getEntriesByType('resource');
    return {
      domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadEventMs: Math.round(nav?.loadEventEnd || 0),
      resourceRequests: resources.length,
      transferredBytes: resources.reduce((n,r)=>n+(r.transferSize || 0),0),
      viewport: {width:innerWidth,height:innerHeight},
      type: 'local-ci-baseline-not-real-user-data'
    };
  }""")
  self.assertGreater(metrics['loadEventMs'],0)
  self.assertGreater(metrics['resourceRequests'],0)
  Path('/tmp/gamo-loading-baseline.json').write_text(
   json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf-8'
  )

 def test_dashboard_and_navigation(self):
  expect(self.page.locator('h1')).to_have_text('Centro de operaciones')
  for route in ['reservas','agenda','conductores','vehiculos','clientes','facturacion','cobros','finanzas','reportes']:
   self.page.locator(f'#nav a[data-page="{route}"]').click()
   expect(self.page.locator('h1')).to_be_visible()
   self.assertGreater(len(self.page.locator('#content').inner_text()),100)
  self.navigate('inicio')
  self.page.screenshot(path='/tmp/gamo-desktop.png',full_page=True)

 def test_section_headers_start_at_the_same_vertical_position(self):
  # Changing modules must not leave the header hidden or retain an old scroll offset.
  self.navigate('cobros')
  expect(self.page.locator('h1')).to_have_text('Cuentas por cobrar')
  cobros_top=self.page.locator('.page-header').evaluate('el => el.getBoundingClientRect().top')
  self.assertEqual(self.page.evaluate('window.scrollY'),0)
  self.assertGreater(cobros_top,0)
  self.page.evaluate('window.scrollTo(0, 400)')
  self.assertGreater(self.page.evaluate('window.scrollY'),0)
  self.navigate('facturacion')
  expect(self.page.locator('h1')).to_have_text('Facturación internacional')
  facturacion_top=self.page.locator('.page-header').evaluate('el => el.getBoundingClientRect().top')
  self.assertEqual(self.page.evaluate('window.scrollY'),0)
  self.assertAlmostEqual(facturacion_top,cobros_top,delta=1)
  self.assertEqual(self.page.locator('.topbar').evaluate('el => Math.round(el.getBoundingClientRect().top)'),0)
  expect(self.page.locator('#content')).to_be_focused()
  self.navigate('cobros')
  self.assertEqual(self.page.evaluate('window.scrollY'),0)

 def navigate(self,route):
  self.page.locator(f'#nav a[data-page="{route}"]').click()
 def save(self):
  self.page.locator('#modal-form button[type=submit]').click()
  expect(self.page.locator('[role=dialog]')).to_have_count(0)
 def data(self):
  return self.page.evaluate("JSON.parse(localStorage.getItem('gamo.demo.v1'))")
 def test_booking_create_edit_persist_export_and_reset(self):
  self.navigate('reservas');self.page.get_by_role('button',name='Nueva reserva',exact=True).click()
  for name,value in [('passengers','Pasajero de prueba'),('origin','Ezeiza'),('destination','Palermo')]:
   self.page.locator('#f-'+name).fill(value)
  self.save();self.page.locator('#booking-search').fill('Pasajero de prueba')
  expect(self.page.locator('#booking-results tbody tr')).to_have_count(1)
  self.page.get_by_role('button',name='Ver / editar',exact=True).click()
  self.page.locator('#f-destination').fill('Recoleta');self.save()
  self.assertEqual(len(self.data()['bookings']),29)
  self.page.reload();self.page.locator('#booking-search').fill('Pasajero de prueba')
  expect(self.page.locator('#booking-results')).to_contain_text('Recoleta')
  with self.page.expect_download() as download:
   self.page.get_by_role('button',name='Exportar CSV',exact=True).click()
  text=Path(download.value.path()).read_text(encoding='utf-8-sig')
  self.assertIn('Pasajero de prueba',text)
  self.assertIn('Recoleta',text)
  self.page.get_by_role('button',name='Restaurar datos demo',exact=True).click()
  self.page.locator('#f-confirm').fill('RESTAURAR');self.save()
  self.assertEqual(len(self.data()['bookings']),28)
 def test_consolidation_partial_cross_currency_payment(self):
  self.navigate('facturacion');self.page.get_by_role('button',name='Preparar documento',exact=True).click()
  self.page.locator('#f-companyId').select_option('C5')
  self.page.locator('#select-all').check()
  self.assertEqual(self.page.locator('[name=bookingIds]:checked').count(),2)
  self.save();invoice=self.data()['invoices'][-1]
  row=self.page.locator('tr').filter(has_text='Borrador '+invoice['id'][-6:])
  row.get_by_role('button',name='Ver documento').click()
  self.page.get_by_role('button',name='Marcar emitida (DEMO)').click()
  self.page.locator('#f-number').fill('DEMO-TEST-001');self.save()
  self.page.locator('tr').filter(has_text='DEMO-TEST-001').get_by_role('button',name='Ver documento').click()
  self.page.get_by_role('button',name='Registrar pago',exact=True).click()
  self.page.locator('#f-amount').fill('10');self.save()
  self.page.locator('tr').filter(has_text='DEMO-TEST-001').get_by_role('button',name='Ver documento').click()
  expect(self.page.locator('#print-document')).to_contain_text('Parcialmente pagada')
  self.page.get_by_role('button',name='Registrar pago',exact=True).click()
  self.page.locator('#f-currency').select_option('USD')
  self.page.locator('#f-conversion').fill('0.5')
  self.page.locator('#f-amount').fill(str((invoice['total']-10)*2))
  self.save()
  self.page.locator('tr').filter(has_text='DEMO-TEST-001').get_by_role('button',name='Ver documento').click()
  expect(self.page.locator('#print-document')).to_contain_text('Pagada')
  expect(self.page.get_by_role('button',name='Registrar pago',exact=True)).to_have_count(0)
  self.page.pdf(path='/tmp/gamo-documento.pdf',format='A4')
  self.page.get_by_role('button',name='Cerrar',exact=True).click()
  self.page.get_by_role('button',name='Preparar documento',exact=True).click()
  self.page.locator('#f-companyId').select_option('C5')
  expect(self.page.locator('[name=bookingIds]')).to_have_count(0)
  self.page.get_by_role('button',name='Cerrar',exact=True).click()
  self.page.reload();self.assertEqual(self.data()['payments'][-1]['applied'],invoice['total']-10)
 def test_company_driver_vehicle_crud_and_search(self):
  for route,action,values,search in [
   ('clientes','company',{'name':'Empresa prueba','country':'Uruguay'},'Uruguay'),
   ('conductores','driver',{'name':'Conductor prueba','license':'TEST-123'},'Conductor prueba'),
   ('vehiculos','vehicle',{'name':'Auto prueba','plate':'TEST-999'},'TEST-999')]:
   self.navigate(route);self.page.locator(f'[data-action={action}-new]').click()
   for name,value in values.items():self.page.locator('#f-'+name).fill(value)
   self.save();self.page.locator('#entity-search').fill(search)
   expect(self.page.locator('#entity-results .entity-card')).to_have_count(1)
   self.page.get_by_role('button',name='Editar ficha',exact=True).click()
   self.page.locator('#f-name').fill(values['name']+' actualizado');self.save()
   expect(self.page.locator('#entity-results')).to_contain_text('actualizado')
 def test_mobile_navigation_no_page_overflow(self):
  self.page.set_viewport_size({'width':390,'height':844})
  self.page.get_by_role('button',name='Abrir menú',exact=True).click()
  self.page.locator('#nav a[data-page="facturacion"]').click()
  expect(self.page.locator('h1')).to_have_text('Facturación internacional')
  self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
  self.page.screenshot(path='/tmp/gamo-mobile.png',full_page=True)
 def test_mobile_menu_keyboard_focus_and_route_label(self):
  self.page.set_viewport_size({'width':390,'height':844})
  menu=self.page.locator('#menu-btn')
  self.assertTrue(self.page.locator('#sidebar').evaluate('el => el.inert'))
  expect(menu).to_have_attribute('aria-expanded','false')
  menu.click()
  expect(self.page.locator('#sidebar')).to_have_attribute('role','dialog')
  expect(self.page.locator('#sidebar')).to_have_attribute('aria-modal','true')
  expect(self.page.locator('#menu-close-btn')).to_be_focused()
  self.assertTrue(self.page.locator('.workspace').evaluate('el => el.inert'))
  self.page.keyboard.press('Shift+Tab')
  self.assertTrue(self.page.evaluate('document.activeElement.closest("#sidebar") !== null'))
  self.page.keyboard.press('Tab')
  expect(self.page.locator('#menu-close-btn')).to_be_focused()
  self.page.keyboard.press('Escape')
  expect(menu).to_be_focused()
  expect(menu).to_have_attribute('aria-expanded','false')
  self.assertFalse(self.page.locator('.workspace').evaluate('el => el.inert'))
  self.assertTrue(self.page.locator('#sidebar').evaluate('el => el.inert'))
  menu.click()
  self.page.locator('#nav a[data-page="reservas"]').click()
  expect(self.page.locator('h1')).to_have_text('Reservas y viajes')
  expect(self.page.locator('#content')).to_be_focused()
  expect(self.page.locator('#content')).to_have_attribute('aria-label','Reservas — GAMO TRANSFER')
  self.assertEqual(self.page.title(),'Reservas | GAMO TRANSFER')
  self.assertTrue(self.page.locator('#sidebar').evaluate('el => el.inert'))
  self.assertFalse(self.page.locator('.workspace').evaluate('el => el.inert'))
  self.page.set_viewport_size({'width':1200,'height':900})
  self.assertFalse(self.page.locator('#sidebar').evaluate('el => el.inert'))
  self.assertFalse(self.page.locator('.workspace').evaluate('el => el.inert'))
 def test_driver_settlement(self):
  self.navigate('conductores')
  self.page.locator('[data-action=resource-detail]').first.click()
  self.page.get_by_role('button',name='Liquidar servicio',exact=True).first.click()
  self.page.locator('#f-amount').fill('1000');self.save()
  self.assertEqual(self.data()['driverPayments'][-1]['amount'],1000)
 def test_corrupt_storage_preserved_until_explicit_reset(self):
  self.page.evaluate("localStorage.setItem('gamo.demo.v1', '{broken')")
  self.page.reload();expect(self.page.locator('.storage-error')).to_be_visible()
  self.assertEqual(self.page.evaluate("localStorage.getItem('gamo.demo.v1')"),'{broken')
  self.page.get_by_role('button',name='Nueva reserva',exact=True).click()
  self.page.locator('#f-passengers').fill('X');self.page.locator('#f-origin').fill('A');self.page.locator('#f-destination').fill('B')
  self.page.locator('#modal-form button[type=submit]').click()
  expect(self.page.locator('#form-error')).to_contain_text('No se pudieron leer')
 def test_structurally_corrupt_storage_recovers_without_overwrite(self):
  self.page.evaluate("localStorage.setItem('gamo.demo.v1', JSON.stringify({...Gamo.seed(),bookings:[null]}))")
  original=self.page.evaluate("localStorage.getItem('gamo.demo.v1')")
  self.page.reload();expect(self.page.locator('.storage-error')).to_be_visible()
  expect(self.page.locator('h1')).to_have_text('Centro de operaciones')
  self.assertEqual(self.page.evaluate("localStorage.getItem('gamo.demo.v1')"),original)
 def test_html_input_is_text_and_report_export(self):
  self.navigate('clientes');self.page.locator('[data-action=company-new]').click()
  self.page.locator('#f-name').fill('<img src=x onerror=alert(1)>')
  self.page.locator('#f-country').fill('País demo');self.save()
  self.assertEqual(self.page.locator('#entity-results img').count(),0)
  expect(self.page.locator('#entity-results')).to_contain_text('<img src=x onerror=alert(1)>')
  self.navigate('reportes');self.page.locator('#report-group').select_option('country')
  expect(self.page.locator('#report-results')).to_contain_text('Estados Unidos')
  with self.page.expect_download() as download:self.page.get_by_role('button',name='Exportar reporte',exact=True).click()
  self.assertIn('Agrupación',Path(download.value.path()).read_text(encoding='utf-8-sig'))

if __name__=='__main__':unittest.main(verbosity=2)
