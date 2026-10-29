"""Pruebas funcionales con Chromium instalado. Ejecutar desde la raíz del repo."""
import subprocess, time, unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

class DemoTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=subprocess.Popen(['python3','-m','http.server','8765','--bind','127.0.0.1','--directory',str(Path(__file__).resolve().parents[2])],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  cls.pw=sync_playwright().start()
  cls.browser=cls.pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
 @classmethod
 def tearDownClass(cls):
  cls.browser.close();cls.pw.stop();cls.server.terminate();cls.server.wait()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,reduced_motion='reduce')
  self.page=self.context.new_page();self.errors=[]
  self.page.on('pageerror',lambda error:self.errors.append(str(error)))
  self.page.goto('http://127.0.0.1:8765/gamo-app/')
 def tearDown(self):
  self.assertEqual(self.errors,[]);self.context.close()
 def test_dashboard_and_navigation(self):
  expect(self.page.locator('h1')).to_have_text('Tu operación, en un vistazo')
  for route in ['reservas','agenda','conductores','vehiculos','clientes','facturacion','cobros','finanzas','reportes']:
   self.page.locator(f'#nav a[data-page="{route}"]').click()
   expect(self.page.locator('h1')).to_be_visible()
   self.assertGreater(len(self.page.locator('#content').inner_text()),100)
  self.navigate('inicio')
  self.page.screenshot(path='/tmp/gamo-desktop.png',full_page=True)

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
  expect(self.page.locator('h1')).to_have_text('Tu operación, en un vistazo')
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
