import '../css/style.css';
import Alpine from 'alpinejs';
import intersect from '@alpinejs/intersect';
import { infodropApp } from './app.js';

window.Alpine = Alpine;
Alpine.plugin(intersect);
Alpine.data('infodropApp', infodropApp);
Alpine.start();
