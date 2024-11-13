# docs/conf.py
import os
import sys
sys.path.insert(0, os.path.abspath('..'))

# Configuración básica de Sphinx
project = 'App Music Player'
author = 'ZaBaDeV'
release = '1.0'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'myst_parser',  # Si usas archivos Markdown, de lo contrario omite esta línea
]

templates_path = ['_templates']
exclude_patterns = []

# Tema
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
