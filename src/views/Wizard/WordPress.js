import React, { useState, useContext } from 'react'
import { Row, Col, Button, Input, Alert, Progress, FormGroup, Label, Spinner } from 'reactstrap'
import * as fs from 'fs'
import request from 'request'
import progress from 'request-progress'
import { useInput } from '../../utils'
import { wizardStore } from '../setup'
import Extract from 'adm-zip'
import extra from 'fs-extra'
import '../../assets/Themes/apress.zip'
import '../../assets/plugins/vc_clipboard.zip'
import '../../assets/plugins/apcore.zip'
import '../../assets/plugins/apress-importer.zip'
import '../../assets/plugins/js_composer.zip'
import '../../assets/plugins/revslider.zip'
import '../../assets/plugins/Ultimate_VC_Addons.zip'
import { remote } from 'electron'

const WordPress = (props) => {
  const [bar, setBar] = useState(0)
  const [alert, setAlert] = useState({
    msg: null,
    color: null
  })
  const [loading, setLoading] = useState(false)
  const [inputs, setInputs] = useInput({ theme: 'apress' })
  const { query } = useContext(wizardStore)

  const downloadWorpress = () => new Promise((resolve, reject) => {
    setLoading(true)

    progress(request('http://wordpress.org/latest.zip'), { throttle: 100 })
      .on('progress', function ({ percent }) {
        setBar((percent * 100).toFixed(0))
      })
      .on('error', (err) => {
        console.log(err)
        setLoading(false)
        return reject(err)
      })
      .on('end', () => {
        setBar(100)
        resolve()
      })
      .pipe(fs.createWriteStream(`C:/xampp/htdocs/${query.domain}/wordpress.zip`))
  })

  const extractFile = (source) => new Promise((resolve, reject) => {
    try {
      // ran in both old app and new app (unpackaged in dev environment):
      console.log('remote.app.getAppPath(): ', remote.app.getAppPath())
      console.log("remote.app.getPath('appData'): ", remote.app.getPath('appData'))
      const zip = new Extract(`C:/XAMPP/htdocs/${query.domain}/wordpress.zip`)
      const apressZip = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/Themes/apress.zip`)
      const clipboardZip = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/plugins/vc_clipboard.zip`)
      const apressCore = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/plugins/apcore.zip`)
      const apressImporter = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/plugins/apress-importer.zip`)
      const jsComposer = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/plugins/js_composer.zip`)
      const revSlider = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/plugins/revslider.zip`)
      const ultVCAddons = new Extract(`${remote.app.getAppPath()}/.webpack/renderer/assets/plugins/Ultimate_VC_Addons.zip`)

      zip.extractAllTo(`C:/xampp/htdocs/${query.domain}/`, true, true)

      fs.readdir(`C:/xampp/htdocs/${query.domain}/wordpress`, async (err, files) => {
        // handling error
        if (err) {
          return reject(err)
        }
        // listing all files using forEach
        for (const file of files) {
          await extra.move(`C:/xampp/htdocs/${query.domain}/wordpress/${file}`, `C:/xampp/htdocs/${query.domain}/${file}`)
        }
        // delete the zip file
        await fs.unlinkSync(`C:/xampp/htdocs/${query.domain}/wordpress.zip`)
        // delete empty directory
        await fs.rmdirSync(`C:/xampp/htdocs/${query.domain}/wordpress/`)

        // extract the selected theme to the themes folder
        switch (inputs.theme) {
          case 'apress':
            apressZip.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/themes`, true)
            break
        }

        // add the plugins
        clipboardZip.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/plugins`, true)
        apressCore.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/plugins`, true)
        apressImporter.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/plugins`, true)
        jsComposer.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/plugins`, true)
        revSlider.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/plugins`, true)
        ultVCAddons.extractAllTo(`C:/xampp/htdocs/${query.domain}/wp-content/plugins`, true)
        resolve()
      })
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })

  const download = async () => {
    try {
      // download wordpress
      await downloadWorpress()
      // unzip wordpress
      await extractFile()
      setLoading(false)
      setAlert({ msg: 'WordPress installed successfully with the specified theme', color: 'success' })
      setTimeout(_ => props.nextStep(), 1000)
    } catch (e) {
      console.log(e)
      setAlert({ msg: e.message, color: 'danger' })
    }
  }

  return (
    <Row className='align-items-center'>
      <Col>
        <FormGroup tag='fieldset'>
          <legend>Available themes</legend>
          <div className='d-flex flex-row'>
            <FormGroup className='mr-3' check>
              <Label check>
                <Input checked={inputs.theme === 'apress'} type='radio' onChange={setInputs} name='theme' value='apress' />
                APress
              </Label>
            </FormGroup>
          </div>
        </FormGroup>
        <div className='mb-2'>
          <Progress value={bar}>{bar} %</Progress>
        </div>
        <Button color='success' disabled={loading} onClick={download} block>
          {
            loading
              ? <Spinner color='light' />
              : 'DOWNLOAD AND INSTALL'
          }
        </Button>
        {
          alert.msg
            ? <Alert className='mt-4' color={alert.color}>
              {alert.msg}
              </Alert>
            : null
        }
      </Col>
      <Col>
        <h1 className='font-weight-bold'>INSTALL WORDPRESS</h1>
        <p>Get all tidy and set up!</p>
        <p className='mb-3'>
          We will install the latest version of WordPress and you can pick between one of the available themes to install,
          we will take care of all the set up, you just need to add a databaseand do the 5 minutes ordpress install!
        </p>
      </Col>
    </Row>
  )
}

export default WordPress
