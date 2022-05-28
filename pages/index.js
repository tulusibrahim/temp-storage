import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useState, useRef, useEffect } from 'react';
import { VscCopy } from 'react-icons/vsc';
import { BsCardList } from 'react-icons/bs';
import { supabase } from '../helper';
import { v4 as uuidv4 } from 'uuid';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function Home() {
  const [data, setData] = useState([])
  const [view, setView] = useState('detail')
  const [openMenu, setOpenMenu] = useState(null)
  const storageName = 'temp-storage'
  const baseURL = 'https://temp-storage.vercel.app/api/'
  let inputRef = useRef()
  // console.log(Date.now())

  // let time = new Date()
  // let hooks = `${time.getMinutes()}:${time.getSeconds()}`
  // console.log('delete data ran! ', hooks, fileName)
  // setTimeout(() => {
  //   deleteData('tulus')
  // }, 3000);
  // setTimeout(() => {
  //   deleteData('faza')
  // }, 5000);
  // setTimeout(() => {
  //   deleteData('cani')
  // }, 2000);
  // setTimeout(() => {
  //   deleteData('asya')
  // }, 11000);

  const getData = async (second) => {
    let session = localStorage.getItem('user-session')
    let data = await supabase.from('temp_storage').select().eq('user_session', session)
    console.log(data)
    setData(data.data)
  }

  const getSubscription = async (second) => {
    const mySubscription = supabase
      .from('temp_storage')
      .on('*', payload => {
        console.log('theres ' + payload.eventType + ' change!')
        getData()
      })
      .subscribe()
  }

  const handleSubs = (change) => {
    if (change.eventType == 'DELETE') {
      let copy = [...data]
      copy.filter(i => i.id !== change.old.id)
      setData([...copy])
    }
    else if (change.eventType == 'INSERT') {
      setData([...data, change.new])
    }
  }

  const getSignedURL = async (imageID) => {
    const { publicURL, error } = await supabase.storage.from('temp-storage').getPublicUrl(imageID)
    return publicURL
  }

  const btnClick = (second) => {
    inputRef.current.click()
  }

  const checkIsSessionExist = (second) => {
    let temp = localStorage.getItem('user-session')
    if (temp == null) {
      let session = uuidv4()
      localStorage.setItem('user-session', session)
    }
  }

  const fileChange = async (e) => {
    const { files } = e.target;
    console.log(files)

    uploadImage(files[0], 3)
  }

  const uploadImage = async (files, retry) => {
    checkIsSessionExist()

    let randomName = Math.random().toString(36).substr(2, 6)

    let insertImage = await supabase.storage.from(storageName).upload(randomName, files)
    console.log(insertImage)

    if (insertImage.error) {
      if (retry > 0) return uploadImage(files, retry - 1)
      console.log('Failed to upload image')
    }
    else {
      let imageID = insertImage.data.Key.substr(insertImage.data.Key.length - 6)
      let session = localStorage.getItem('user-session')
      insertImageReferenceToDB(imageID, session)

      // setTimeout(() => {
      //   deleteImageFromStorage(imageID, 3)
      //   deleteImageReferenceFromDB(imageID)
      // }, 20000);
      // 1800000
    }
  }

  const insertImageReferenceToDB = async (imageID, session) => {
    let url = await getSignedURL(imageID)
    let insert = await supabase.from('temp_storage').insert({ file_name: imageID, user_session: session, url: url, timestamp: Date.now() })
    console.log(insert)

    insert.error && console.log('Failed to add reference')
    requestDelete(imageID)
  }

  const requestDelete = async (imageID, retry = 3) => {
    try {
      let request = await fetch(baseURL + imageID)
      console.log('request delete made!')
      console.log(await request.json())
    } catch (error) {
      if (retry > 0) return requestDelete(imageID, retry - 1)
      console.log('Failed to request delete', error)
    }
  }

  const deleteImageReferenceFromDB = async (imageID, retry = 3) => {
    let deleteImageReference = await supabase.from('temp_storage').delete().eq('file_name', imageID)
    console.log(deleteImageReference)

    if (deleteImageReference.error) {
      if (retry > 0) return deleteImageReferenceFromDB(imageID, retry - 1)
      console.log('Failed to delete reference image')
    }
  }

  const deleteImageFromStorage = async (fileName, retry = 3) => {
    let deleteImage = await fetch(baseURL + fileName, { method: 'POST' })
    let json = await deleteImage.json()
    console.log(json)
    // let deleteImage = await supabase.storage.from(storageName).remove([fileName])
    // console.log(deleteImage)

    // if (deleteImage.error) {
    //   if (retry > 0) return deleteImage(fileName, retry - 1)
    //   console.log('Failed to delete reference image')
    // }
  }

  const copyURL = (url) => {
    navigator.clipboard.writeText(url);
  }

  const ImageTemplate = ({ img }) => {
    return (
      <div className='min-w-20 relative min-h-20 rounded-md shadow-md my-4'>
        {/* <img className='p-3 bg-gray-500 cursor-pointer right-2 rounded-md top-2 absolute' onClick={() => copyURL(img)} /> */}
        <span className='bg-[#d4a15b] p-1 cursor-pointer right-2 rounded-md top-2 absolute opacity-90' onClick={() => copyURL(img.url)}>
          <VscCopy size={20} color='black' />
        </span>
        <img src={img} className='shadow-sm shadow-[#ECB365] object-cover rounded-md' style={{ height: 200, width: 200 }} alt={img.file_name} />
      </div>
    )
  }

  const ImageTemplateDetail = ({ img }) => {
    return (
      <div className='min-w-min w-full flex justify-between items-center relative min-h-20 py-4 px-4 duration-200 rounded-md my-4 bg-[#002f58] hover:bg-[#062542]'>
        <div className='w-1/4 flex items-center'>
          <img src={img.url} className='rounded-md object-cover shadow-sm shadow-[#ECB365]' style={{ height: 50, width: 50 }} alt={img.file_name} />
          <div className='ml-4'>{img.file_name}</div>
        </div>
        <span className='bg-[#d4a15b] p-1 cursor-pointer rounded-md ' onClick={() => copyURL(img.url)}>
          <VscCopy size={20} color='black' />
        </span>
      </div>
    )
  }

  useEffect(() => {
    getData()
    getSubscription()
  }, [])

  return (
    <div className='w-full min-h-screen h-fit bg-[#041C32] text-white flex justify-evenly items-center flex-col'>
      <Head>
        <title>Temp Storage</title>
        <meta name="description" content="Upload image to the cloud, temporary for only 1 hour." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet"></link>
        <link rel="icon" href="https://img.icons8.com/emoji/48/000000/blue-circle-emoji.png" />
      </Head>

      <div className='w-3/4 h-1/4 py-10 flex justify-evenly items-center flex-col font-[Poppins]'>
        <div className='w-full text-7xl font-bold mb-4 tracking-wide flex justify-center'>
          Temp Storage
        </div>
        <div className='w-full h-fit text-2xl flex my-4 justify-center'>
          Upload image in a matter of seconds, and get the public URL for 1 hour.
        </div>
        {/* bg-[#00607A] hover:bg-[#005066] */}
        <button className='w-fit h-fit px-2 py-1 text-xl rounded-md duration-200 bg-[#ECB365] text-black hover:bg-[#b38649]' onClick={btnClick}>Choose image</button>
        <input type="file" ref={inputRef} className='hidden' accept="image/*" onChange={fileChange} />
      </div>
      {
        // data.length > 0 &&
        <div className='w-3/4 flex justify-between items-center'>
          <div className='w-fit italic font-[Poppins] text-sm'>
            Your uploaded file will appear here.
          </div>
          <Button
            onClick={e => setOpenMenu(e.currentTarget)}
            className='text-white flex justify-center text-lg hover:bg-[#093661] capitalize font-[Poppins]'
          >
            {view}
            <BsCardList className='ml-3' />
          </Button>
          <Menu
            anchorEl={openMenu}
            open={openMenu}
            onClose={() => setOpenMenu(null)}
          >
            <MenuItem onClick={() => setView('image')}>Image</MenuItem>
            <MenuItem onClick={() => setView('detail')}>Detail</MenuItem>
          </Menu>
        </div>
      }
      <div className='w-3/4 flex flex-wrap flex-row justify-between'>
        {
          data ?
            view == 'image' ?
              data.map((i) => (
                <ImageTemplate img={i.url} key={i.file_name} />
              ))
              :
              data.map(i => (
                <ImageTemplateDetail img={i} key={i.file_name} />
              ))
            : null
        }
      </div>
    </div>
  )
}
