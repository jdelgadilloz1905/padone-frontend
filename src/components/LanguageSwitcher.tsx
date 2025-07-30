import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  // Función segura para obtener traducciones con fallback
  const getSafeTranslation = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation && translation !== key ? translation : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const currentLanguageLabel = i18n.language === 'es' 
    ? getSafeTranslation('config.languages.spanish', 'Español')
    : getSafeTranslation('config.languages.english', 'English');

  return (
    <Box>
      <Button
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        color="inherit"
        size="small"
        sx={{ textTransform: 'none' }}
      >
        {currentLanguageLabel}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        <MenuItem onClick={() => changeLanguage('es')} selected={i18n.language === 'es'}>
          <ListItemIcon>
            <Box component="span" sx={{ fontSize: 18 }}>🇪🇸</Box>
          </ListItemIcon>
          <ListItemText>{getSafeTranslation('config.languages.spanish', 'Español')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => changeLanguage('en')} selected={i18n.language === 'en'}>
          <ListItemIcon>
            <Box component="span" sx={{ fontSize: 18 }}>🇺🇸</Box>
          </ListItemIcon>
          <ListItemText>{getSafeTranslation('config.languages.english', 'English')}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher; 