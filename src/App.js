import logo from './logo.svg';
import './App.css';
import { Button, Icon, useToast } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { VscCopy } from 'react-icons/vsc';

function App() {
  let supabase = createClient('https://bbgnpwbarxehpmmnyfgq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzE4NzU2NywiZXhwIjoxOTQyNzYzNTY3fQ.HtwezwLxcXQEMTOl-vH6b9SszRtByhX1FSF-dOEqrBc')
  let storageName = 'temp-storage'
  const baseURL = 'http://localhost:3001'
  let inputRef = useRef(null)
  const [image, setimage] = useState([])
  const toast = useToast()

  const chooseFile = (e) => {
    const { files } = e.target;
    upload(files[0], files[0].name)
  }

  useEffect(() => {
    console.log(image)
  }, [image])

  const testt = (second) => {

  }


  const upload = async (file, name) => {
    console.log('sampe sini')
    let insert = await supabase.storage.from(storageName).upload(name, file, {
      cacheControl: '3600',
      upsert: false
    })
    console.log(insert)

    if (insert.data) {
      const { publicURL, error } = supabase
        .storage
        .from(storageName)
        .getPublicUrl(name)
      // if (image.length) {
      //   setimage(e => [...e, publicURL])
      // }
      // else {
      //   setimage([publicURL])
      // }
      insertReferenceToDB(name, publicURL)
    }
    else {
      toast({
        description: "Something went wrong, please try again.",
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const insertReferenceToDB = async (name, url) => {
    let minute = new Date().getMinutes() < 10 ? String(new Date().getMinutes()).padStart(2, '0') : new Date().getMinutes()
    let input = await supabase.from('temp_storage').insert({
      file_name: name,
      timestamp: `${new Date().getHours()}${minute}`,
      user_session: localStorage.getItem('session'),
      url: url
    })
    console.log(input)
    if (input.data) {
      // localStorage.removeItem('list')
      // localStorage.setItem('list', JSON.stringify(image))
      checkSession()
      toast({ description: "Image upload success.", status: 'success', isClosable: true, })
    }
    if (input.error) toast({ description: "Something went wrong, please try again.", status: 'error', isClosable: true, })

  }

  const checkSession = async (second) => {
    // localStorage.removeItem('session')
    // localStorage.removeItem('list')
    let tempId = localStorage.getItem('session')
    // console.log(tempId)
    if (tempId == null) {
      console.log('gada id')
      localStorage.setItem('session', uuidv4())
    }
    else {
      let select = await supabase.from('temp_storage').select().eq('user_session', tempId)
      setimage(select.data)
      // let imgs = localStorage.getItem('list')
      // console.log('nehhh ', imgs)
      // if (imgs !== null) {
      //   setimage(JSON.parse(imgs))
      // }
      // console.log(tempId)
    }
  }

  const copyURL = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      description: "URL copied.",
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const ImageTemplate = ({ img }) => {
    return (
      <div style={{ minWidth: 100, position: 'relative', minHeight: 100, borderRadius: 10, boxShadow: '0px 0px 5px 1px rgba(255,255,255,0.75)', margin: 10 }}>
        <Icon boxSize={8} padding={1} onClick={() => copyURL(img)} bgColor={'grey'} cursor='pointer' right={2} borderRadius={5} top={2} position='absolute' as={VscCopy} />
        <img src={img} style={{ height: 150, width: 150, borderRadius: 10, objectFit: 'contain' }} alt="" />
      </div>
    )
  }

  useEffect(() => {
    checkSession()
    console.log(`${new Date().getHours()}${new Date().getMinutes()}`)
  }, [])

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#1A202C', color: 'white', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ fontSize: 44, fontWeight: 'bold', }} onClick={testt}>
          TempStorage
        </div>
        <div style={{ fontSize: 24, }}>Upload image in a matter of seconds, and get the public URL for 30 minutes.</div>
      </div>
      <Button mb={'20px'} onClick={() => inputRef.current.click()} color={'whiteAlpha.900'} _hover={{ bg: '#202736' }} bg='#1A202C' borderWidth={1}>
        {image?.length ? 'Choose more' : 'Choose a file'}
      </Button>
      <input type="file" accept="image/*" multiple onChange={chooseFile} ref={inputRef} style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', flexWrap: 'wrap', width: '70%', }}>
        {
          image.map(i => (
            <ImageTemplate img={i.url} />
          ))
        }
      </div>
      {/* <div>{new Date().getFullYear()}</div> */}
    </div>
  );
}

export default App;
