import MaterialTailwind from '@material-tailwind/react'

declare module '@material-tailwind/react' {
  interface ButtonProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface NavbarProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface TypographyProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface MenuListProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface MenuItemProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }
  
  interface IconButtonProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface CardProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface CardBodyProps {
    placeholder?
    onPointerEnterCapture?
    onPointerLeaveCapture?
  }

  interface InputProps {
    onPointerEnterCapture?
    onPointerLeaveCapture?
    crossOrigin?
  }
}