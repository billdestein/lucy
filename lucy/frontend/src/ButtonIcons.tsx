import React from 'react'
import { BsArrowLeftShort } from 'react-icons/bs'
import { BsChevronLeft } from 'react-icons/bs'
import { BsChevronRight } from 'react-icons/bs'
import { BsFile } from 'react-icons/bs'
import { BsFolder } from 'react-icons/bs'
import { BsGear } from 'react-icons/bs'
import { BsPlay } from 'react-icons/bs'
import { BsPlusLg } from 'react-icons/bs'
import { BsTrash } from 'react-icons/bs'
import { BsUpload } from 'react-icons/bs'
import { BsX } from 'react-icons/bs'
import { BsSkipBackwardFill } from 'react-icons/bs'
import { BsSkipForwardFill } from 'react-icons/bs'
import { FaArrowCircleLeft } from 'react-icons/fa'
import { FaArrowCircleRight } from 'react-icons/fa'
import { FaRegCopy } from 'react-icons/fa6'
import { FaRegSave } from 'react-icons/fa'
import { FaSave } from 'react-icons/fa'

const size = 18

export const ButtonIcons = {
    back: <BsArrowLeftShort size={size} />,
    goLeft: <BsChevronLeft size={size} />,
    goRight: <BsChevronRight size={size} />,
    faRegCopy: <FaRegCopy size={16} />,
    file: <BsFile size={size} />,
    folder: <BsFolder size={size} />,
    gear: <BsGear size={size} />,
    next: <FaArrowCircleRight size={size} />,
    play: <BsPlay size={size} />,
    plus: <BsPlusLg size={16} />,
    previous: <FaArrowCircleLeft size={size} />,
    trash: <BsTrash size={size} />,
    upload: <BsUpload size={14} />,
    x: <BsX size={20} />,
    save: <FaRegSave size={size} />,
    saveAs: <FaSave size={size} />,
    skipBackward: <BsSkipBackwardFill size={size} />,
    skipForward: <BsSkipForwardFill size={size} />,
}
